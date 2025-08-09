import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import pickle
import os
import kagglehub

# --- Configuration ---
DATASET_HANDLE = 'dhoogla/cicddos2019'
PARQUET_FILENAME = 'DNS-testing.parquet' 

MODEL_PATH = 'ddos_random_forest_model.pkl'
SCALER_PATH = 'ddos_scaler.pkl'
# --- NEW ---
# We will now save the list of features the model was trained on
FEATURE_LIST_PATH = 'feature_list.pkl'

def train_ddos_model():
    """
    Downloads the dataset, trains a model, and saves the model, scaler,
    and the list of features used for training.
    """
    # --- 1. Download and Load Data ---
    print(f"Downloading dataset '{DATASET_HANDLE}' from Kaggle...")
    try:
        dataset_root_path = kagglehub.dataset_download(DATASET_HANDLE)
        full_parquet_path = os.path.join(dataset_root_path, PARQUET_FILENAME)
    except Exception as e:
        print(f"Error downloading dataset: {e}")
        return

    print(f"Loading dataset from '{full_parquet_path}'...")
    try:
        df = pd.read_parquet(full_parquet_path)
    except Exception as e:
        print(f"Error reading Parquet file: {e}")
        return

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
    # This maps the dataset's column names to our real-time feature names.
    feature_map = {
        'Flow Duration': 'flow_duration',
        'Total Fwd Packets': 'total_packets',
        'Total Length of Fwd Packets': 'total_bytes',
        'Fwd Packet Length Min': 'min_packet_len',
        'Fwd Packet Length Max': 'max_packet_len',
        'Fwd Packet Length Mean': 'mean_packet_len',
        'Fwd Packet Length Std': 'std_packet_len',
        'Flow IAT Mean': 'mean_inter_arrival_time',
        'Flow IAT Std': 'std_inter_arrival_time',
        'Flow IAT Max': 'max_inter_arrival_time'
    }
    
    # Select only the columns that are available in the dataframe
    available_features_from_dataset = [col for col in feature_map.keys() if col in X.columns]
    X_selected = X[available_features_from_dataset]
    
    # --- NEW: Get the list of our corresponding real-time feature names ---
    final_feature_list = [feature_map[col] for col in available_features_from_dataset]
    print(f"Model will be trained on these {len(final_feature_list)} features: {final_feature_list}")

    # --- 4. Train-Test Split ---
    X_train, X_test, y_train, y_test = train_test_split(X_selected, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded)

    # --- 5. Scaling ---
    print("Scaling features...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # --- 6. Model Training ---
    print("Training Random Forest model...")
    model = RandomForestClassifier(n_estimators=50, random_state=42, n_jobs=-1, max_depth=10)
    model.fit(X_train_scaled, y_train)

    # --- 7. Evaluation ---
    print("Evaluating model...")
    predictions = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, predictions)
    print(f"\nModel Accuracy: {accuracy * 100:.2f}%")
    
    class_names = label_encoder.inverse_transform(np.unique(y_test))
    print("\nClassification Report:")
    print(classification_report(y_test, predictions, target_names=class_names))

    # --- 8. Save Model, Scaler, and Feature List ---
    print(f"Saving model to '{MODEL_PATH}'...")
    with open(MODEL_PATH, 'wb') as f: pickle.dump(model, f)

    print(f"Saving scaler to '{SCALER_PATH}'...")
    with open(SCALER_PATH, 'wb') as f: pickle.dump(scaler, f)
        
    # --- NEW ---
    print(f"Saving feature list to '{FEATURE_LIST_PATH}'...")
    with open(FEATURE_LIST_PATH, 'wb') as f: pickle.dump(final_feature_list, f)
        
    print("\nTraining complete. All artifacts are ready.")

if __name__ == "__main__":
    train_ddos_model()
