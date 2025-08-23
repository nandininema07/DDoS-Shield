import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
import pickle
import os
import kagglehub

# --- Configuration ---
DATASET_HANDLE = 'dhoogla/cicddos2019'
# --- NEW: List of parquet files to combine for training ---
# We will train the model on a variety of attack types.
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

def train_ddos_model():
    """
    Downloads the dataset, combines multiple attack types, trains a model,
    and saves all necessary artifacts.
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
            # Sample a portion of each file to keep the dataset size manageable
            df_sample = pd.read_parquet(full_path).sample(n=20000, random_state=42, replace=True)
            df_list.append(df_sample)
        else:
            print(f"Warning: {filename} not found, skipping.")
    
    if not df_list:
        print("Error: No dataset files could be loaded.")
        return
        
    # Combine all dataframes
    df = pd.concat(df_list, ignore_index=True)
    print(f"Combined dataset has {len(df)} rows.")
    print(f"Attack types in dataset: {df['Label'].unique()}")

    # --- 2. Preprocessing ---
    print("Preprocessing data...")
    cols_to_drop = ['Unnamed: 0', 'Flow ID', 'Source IP', 'Source Port', 'Destination IP', 'Destination Port', 'Timestamp', 'SimillarHTTP']
    df.drop(columns=[col for col in cols_to_drop if col in df.columns], inplace=True)
    df.columns = [col.strip() for col in df.columns]
    df.replace([np.inf, -np.inf], np.nan, inplace=True)
    df.dropna(inplace=True)

    X = df.drop(['Label'], axis=1)
    y = df['Label']

    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    # --- 3. Feature Matching ---
    feature_map = {
        'Flow Duration': 'flow_duration', 'Total Fwd Packets': 'total_packets', 
        'Total Length of Fwd Packets': 'total_bytes', 'Fwd Packet Length Min': 'min_packet_len', 
        'Fwd Packet Length Max': 'max_packet_len', 'Fwd Packet Length Mean': 'mean_packet_len', 
        'Fwd Packet Length Std': 'std_packet_len', 'Flow IAT Mean': 'mean_inter_arrival_time', 
        'Flow IAT Std': 'std_inter_arrival_time', 'Flow IAT Max': 'max_inter_arrival_time'
    }
    
    available_features = [col for col in feature_map.keys() if col in X.columns]
    X_selected = X[available_features]
    final_feature_list = [feature_map[col] for col in available_features]
    print(f"Model will be trained on these {len(final_feature_list)} features.")

    # --- 4. Train-Test Split, Scaling, and Training ---
    X_train, X_test, y_train, y_test = train_test_split(X_selected, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    print("Training Logistic Regression model...")
    model = LogisticRegression(random_state=42, n_jobs=-1, max_iter=1000)
    model.fit(X_train_scaled, y_train)

    # --- 7. Evaluation ---
    print("Evaluating model...")
    predictions = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, predictions)
    print(f"\nModel Accuracy: {accuracy * 100:.2f}%")
    
    class_names = label_encoder.inverse_transform(np.unique(y_encoded))
    print("\nClassification Report:")
    print(classification_report(y_test, predictions, target_names=class_names))

    # --- 8. Save All Artifacts ---
    with open(MODEL_PATH, 'wb') as f: pickle.dump(model, f)
    with open(SCALER_PATH, 'wb') as f: pickle.dump(scaler, f)
    with open(FEATURE_LIST_PATH, 'wb') as f: pickle.dump(final_feature_list, f)
    with open(LABEL_ENCODER_PATH, 'wb') as f: pickle.dump(label_encoder, f)
        
    print("\nTraining complete. All artifacts are ready.")

if __name__ == "__main__":
    train_ddos_model()
