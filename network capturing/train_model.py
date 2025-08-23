import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import pickle
import os
import kagglehub
from imblearn.over_sampling import SMOTE
from imblearn.under_sampling import RandomUnderSampler
from imblearn.pipeline import Pipeline as ImbPipeline
from collections import Counter
import matplotlib.pyplot as plt
import seaborn as sns

# --- Configuration ---
DATASET_HANDLE = 'dhoogla/cicddos2019'
PARQUET_FILES = [
    'DNS-testing.parquet',
    'Syn-testing.parquet',
    'UDP-testing.parquet',
    'NTP-testing.parquet',
    'LDAP-testing.parquet'
]

MODEL_PATH = 'ddos_random_forest_model.pkl'
SCALER_PATH = 'ddos_scaler.pkl'
FEATURE_LIST_PATH = 'feature_list.pkl'
LABEL_ENCODER_PATH = 'label_encoder.pkl'

def train_ddos_model_improved():
    """
    Improved training with better overfitting prevention techniques.
    """
    # --- 1. Download and Load Data ---
    print(f"Downloading dataset '{DATASET_HANDLE}' from Kaggle...")
    try:
        dataset_root_path = kagglehub.dataset_download(DATASET_HANDLE)
    except Exception as e:
        print(f"Error downloading dataset: {e}")
        return

    df_list = []
    for filename in PARQUET_FILES:
        full_path = os.path.join(dataset_root_path, filename)
        if os.path.exists(full_path):
            print(f"Loading and sampling from {filename}...")
            df_temp = pd.read_parquet(full_path)
            print(f"  {filename} has {len(df_temp)} rows")
            
            # Sample based on available data size
            sample_size = min(15000, len(df_temp))
            df_sample = df_temp.sample(n=sample_size, random_state=42, replace=False)
            df_list.append(df_sample)
    
    if not df_list:
        print("Error: No dataset files could be loaded.")
        return
        
    df = pd.concat(df_list, ignore_index=True)
    print(f"Combined dataset has {len(df)} rows.")

    # --- 2. Enhanced Preprocessing ---
    print("Preprocessing data...")
    cols_to_drop = ['Unnamed: 0', 'Flow ID', 'Source IP', 'Source Port', 
                   'Destination IP', 'Destination Port', 'Timestamp', 'SimillarHTTP']
    df.drop(columns=[col for col in cols_to_drop if col in df.columns], inplace=True)
    df.columns = [col.strip() for col in df.columns]
    
    # Handle infinite values more carefully
    df.replace([np.inf, -np.inf], np.nan, inplace=True)
    
    # Check class distribution before outlier removal
    print(f"Class distribution before preprocessing: {df['Label'].value_counts().to_dict()}")
    
    # More conservative outlier removal - only remove extreme outliers
    numeric_columns = df.select_dtypes(include=[np.number]).columns.drop(['Label'], errors='ignore')
    initial_length = len(df)
    
    for col in numeric_columns:
        if col in df.columns:
            # Use more conservative outlier bounds (3 IQR instead of 1.5)
            Q1 = df[col].quantile(0.05)  # Use 5th and 95th percentiles instead of 25th/75th
            Q3 = df[col].quantile(0.95)
            IQR = Q3 - Q1
            lower_bound = Q1 - 3 * IQR  # More conservative bounds
            upper_bound = Q3 + 3 * IQR
            
            before_removal = len(df)
            df = df[(df[col] >= lower_bound) & (df[col] <= upper_bound)]
            after_removal = len(df)
            
            # If we lose more than 20% of data on any single column, skip outlier removal for that column
            if (before_removal - after_removal) / before_removal > 0.2:
                print(f"Warning: Column {col} would remove {((before_removal - after_removal) / before_removal * 100):.1f}% of data. Skipping outlier removal for this column.")
                # Reload the data for this column
                df_temp = pd.concat([df_list[i] for i in range(len(df_list))], ignore_index=True)
                df_temp.drop(columns=[col for col in cols_to_drop if col in df_temp.columns], inplace=True)
                df_temp.columns = [col.strip() for col in df_temp.columns]
                df_temp.replace([np.inf, -np.inf], np.nan, inplace=True)
                df = df_temp  # Reset to data without this column's outlier removal
                break
    
    # Remove rows with NaN values
    df.dropna(inplace=True)
    print(f"After preprocessing: {len(df)} rows.")
    print(f"Class distribution after preprocessing: {df['Label'].value_counts().to_dict()}")
    
    # Ensure we have multiple classes
    if df['Label'].nunique() < 2:
        print("Error: Only one class remaining after preprocessing. Using less aggressive preprocessing...")
        # Fallback to simpler preprocessing
        df = pd.concat(df_list, ignore_index=True)
        df.drop(columns=[col for col in cols_to_drop if col in df.columns], inplace=True)
        df.columns = [col.strip() for col in df.columns]
        df.replace([np.inf, -np.inf], np.nan, inplace=True)
        df.dropna(inplace=True)
        print(f"Fallback preprocessing complete: {len(df)} rows.")
        print(f"Final class distribution: {df['Label'].value_counts().to_dict()}")

    X = df.drop(['Label'], axis=1)
    y = df['Label']

    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    # --- 3. Enhanced Feature Selection ---
    feature_map = {
        'Flow Duration': 'flow_duration', 
        'Total Fwd Packets': 'total_fwd_packets', 
        'Total Backward Packets': 'total_bwd_packets',
        'Total Length of Fwd Packets': 'total_fwd_length', 
        'Total Length of Bwd Packets': 'total_bwd_length',
        'Fwd Packet Length Min': 'min_fwd_packet_len', 
        'Fwd Packet Length Max': 'max_fwd_packet_len', 
        'Fwd Packet Length Mean': 'mean_fwd_packet_len', 
        'Fwd Packet Length Std': 'std_fwd_packet_len',
        'Bwd Packet Length Min': 'min_bwd_packet_len',
        'Bwd Packet Length Max': 'max_bwd_packet_len',
        'Bwd Packet Length Mean': 'mean_bwd_packet_len',
        'Flow IAT Mean': 'mean_inter_arrival_time', 
        'Flow IAT Std': 'std_inter_arrival_time', 
        'Flow IAT Max': 'max_inter_arrival_time',
        'Flow IAT Min': 'min_inter_arrival_time',
        'Fwd IAT Mean': 'mean_fwd_iat',
        'Bwd IAT Mean': 'mean_bwd_iat',
        'Flow Packets/s': 'flow_packets_per_sec',
        'Flow Bytes/s': 'flow_bytes_per_sec'
    }
    
    available_features = [col for col in feature_map.keys() if col in X.columns]
    X_selected = X[available_features]
    final_feature_list = [feature_map[col] for col in available_features]
    
    print(f"Selected {len(available_features)} features for training.")

    # --- 4. Enhanced Train-Test Split ---
    X_train, X_test, y_train, y_test = train_test_split(
        X_selected, y_encoded, 
        test_size=0.3,  # Larger test set
        random_state=42, 
        stratify=y_encoded
    )
    
    # Create validation set from training data
    X_train_final, X_val, y_train_final, y_val = train_test_split(
        X_train, y_train,
        test_size=0.2,  # 20% of training for validation
        random_state=42,
        stratify=y_train
    )
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_final)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)

    # --- 5. Conservative Data Balancing ---
    print("Applying conservative data balancing...")
    
    class_counts = Counter(y_train_final)
    print(f"Original training distribution: {class_counts}")
    
    # Check if we have multiple classes
    if len(class_counts) < 2:
        print("Error: Only one class in training data. Cannot proceed with classification.")
        return
    
    # Use combined over/under sampling for better balance
    max_samples = max(class_counts.values())
    min_samples = min(class_counts.values())
    target_samples = int(np.mean([max_samples, min_samples * 2]))  # More conservative target
    
    print(f"Target samples per class: {target_samples}")
    
    # Only apply resampling if we have imbalanced classes
    if max_samples > min_samples * 2:  # Only if significant imbalance
        # Create pipeline with undersampling then oversampling
        under_strategy = {}
        over_strategy = {}
        
        for label, count in class_counts.items():
            if count > target_samples * 1.5:
                under_strategy[label] = int(min(count, target_samples * 1.5))  # Convert to int
            if count < target_samples:
                over_strategy[label] = int(target_samples)  # Convert to int
        
        print(f"Under-sampling strategy: {under_strategy}")
        print(f"Over-sampling strategy: {over_strategy}")
        
        X_train_balanced = X_train_scaled.copy()
        y_train_balanced = y_train_final.copy()
        
        # Apply under-sampling if needed
        if under_strategy:
            under_sampler = RandomUnderSampler(sampling_strategy=under_strategy, random_state=42)
            X_train_balanced, y_train_balanced = under_sampler.fit_resample(X_train_balanced, y_train_balanced)
        
        # Apply over-sampling if needed and we have enough samples
        if over_strategy and len(np.unique(y_train_balanced)) > 1:
            # Check if we have enough samples for SMOTE
            min_class_size = min(Counter(y_train_balanced).values())
            if min_class_size >= 6:  # SMOTE needs at least 6 samples (default k_neighbors=5)
                over_sampler = SMOTE(
                    sampling_strategy=over_strategy,
                    random_state=42,
                    k_neighbors=min(3, min_class_size-1)  # Adjust k_neighbors based on available samples
                )
                X_train_resampled, y_train_resampled = over_sampler.fit_resample(X_train_balanced, y_train_balanced)
            else:
                print(f"Warning: Not enough samples for SMOTE (min class has {min_class_size} samples). Skipping over-sampling.")
                X_train_resampled, y_train_resampled = X_train_balanced, y_train_balanced
        else:
            X_train_resampled, y_train_resampled = X_train_balanced, y_train_balanced
            
        print(f"Resampled training distribution: {Counter(y_train_resampled)}")
    else:
        print("Classes are relatively balanced. Skipping resampling.")
        X_train_resampled, y_train_resampled = X_train_scaled, y_train_final

    # --- 6. Model Training with Regularization ---
    print("Training Random Forest with regularization...")
    
    # More conservative hyperparameters to prevent overfitting
    model = RandomForestClassifier(
        n_estimators=100,        # Increased for stability
        max_depth=8,             # Reduced depth
        min_samples_split=10,    # Increased minimum samples to split
        min_samples_leaf=5,      # Increased minimum samples per leaf
        max_features='sqrt',     # Limit features per tree
        bootstrap=True,          # Enable bootstrapping
        oob_score=True,          # Out-of-bag scoring for validation
        random_state=42,
        n_jobs=-1,
        class_weight='balanced'  # Additional balancing
    )
    
    model.fit(X_train_resampled, y_train_resampled)
    
    # --- 7. Cross-Validation ---
    print("Performing cross-validation...")
    cv_scores = cross_val_score(
        model, X_train_resampled, y_train_resampled, 
        cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=42),
        scoring='f1_macro'
    )
    print(f"Cross-validation F1 scores: {cv_scores}")
    print(f"Mean CV F1: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")
    
    if hasattr(model, 'oob_score_'):
        print(f"Out-of-bag score: {model.oob_score_:.3f}")

    # --- 8. Evaluation on Validation and Test Sets ---
    print("\n=== Validation Set Performance ===")
    val_predictions = model.predict(X_val_scaled)
    val_accuracy = accuracy_score(y_val, val_predictions)
    print(f"Validation Accuracy: {val_accuracy * 100:.2f}%")
    
    print("\n=== Test Set Performance ===")
    test_predictions = model.predict(X_test_scaled)
    test_accuracy = accuracy_score(y_test, test_predictions)
    print(f"Test Accuracy: {test_accuracy * 100:.2f}%")
    
    class_names = label_encoder.inverse_transform(np.unique(y_encoded))
    print("\nTest Set Classification Report:")
    print(classification_report(y_test, test_predictions, target_names=class_names))
    
    # Check for overfitting by comparing validation and test performance
    print(f"\nOverfitting Check:")
    print(f"Validation Accuracy: {val_accuracy:.3f}")
    print(f"Test Accuracy: {test_accuracy:.3f}")
    print(f"Difference: {abs(val_accuracy - test_accuracy):.3f}")
    
    if abs(val_accuracy - test_accuracy) > 0.05:
        print("⚠️  WARNING: Significant performance gap detected. Model may be overfitting.")
    else:
        print("✅ Performance gap is acceptable.")

    # --- 9. Feature Importance Analysis ---
    feature_importance = pd.DataFrame({
        'feature': available_features,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print(f"\nTop 10 Most Important Features:")
    print(feature_importance.head(10))

    # --- 10. Save All Artifacts ---
    with open(MODEL_PATH, 'wb') as f: 
        pickle.dump(model, f)
    with open(SCALER_PATH, 'wb') as f: 
        pickle.dump(scaler, f)
    with open(FEATURE_LIST_PATH, 'wb') as f: 
        pickle.dump(final_feature_list, f)
    with open(LABEL_ENCODER_PATH, 'wb') as f: 
        pickle.dump(label_encoder, f)
        
    print(f"\nTraining complete. All artifacts saved.")
    print(f"Model performance summary:")
    print(f"- Cross-validation F1: {cv_scores.mean():.3f}")
    print(f"- Validation accuracy: {val_accuracy:.3f}")
    print(f"- Test accuracy: {test_accuracy:.3f}")

if __name__ == "__main__":
    train_ddos_model_improved()