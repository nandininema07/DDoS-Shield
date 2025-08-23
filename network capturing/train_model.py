import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import (classification_report, accuracy_score, precision_score, 
                           recall_score, f1_score, roc_auc_score, confusion_matrix)
import pickle
import os
import kagglehub
from imblearn.over_sampling import SMOTE
from collections import Counter
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import roc_curve, auc
from sklearn.preprocessing import label_binarize
from sklearn.multiclass import OneVsRestClassifier
import warnings
warnings.filterwarnings('ignore')

# --- Configuration ---
DATASET_HANDLE = 'dhoogla/cicddos2019'
PARQUET_FILES = [
    'DNS-testing.parquet',
    'Syn-testing.parquet',
    'UDP-testing.parquet',
    'NTP-testing.parquet',
    'LDAP-testing.parquet'
]

def load_and_preprocess_data():
    """Load and preprocess the DDoS detection dataset"""
    print(f"Downloading dataset '{DATASET_HANDLE}' from Kaggle...")
    try:
        dataset_root_path = kagglehub.dataset_download(DATASET_HANDLE)
    except Exception as e:
        print(f"Error downloading dataset: {e}")
        return None, None, None, None
    
    df_list = []
    for filename in PARQUET_FILES:
        full_path = os.path.join(dataset_root_path, filename)
        if os.path.exists(full_path):
            print(f"Loading and sampling from {filename}...")
            # Sample a portion of each file to keep the dataset size manageable
            df_sample = pd.read_parquet(full_path).sample(n=15000, random_state=42, replace=True)
            df_list.append(df_sample)
    
    if not df_list:
        print("Error: No dataset files could be loaded.")
        return None, None, None, None
        
    df = pd.concat(df_list, ignore_index=True)
    print(f"Combined dataset has {len(df)} rows.")

    # Preprocessing
    print("Preprocessing data...")
    cols_to_drop = ['Unnamed: 0', 'Flow ID', 'Source IP', 'Source Port', 
                   'Destination IP', 'Destination Port', 'Timestamp', 'SimillarHTTP']
    df.drop(columns=[col for col in cols_to_drop if col in df.columns], inplace=True)
    df.columns = [col.strip() for col in df.columns]
    df.replace([np.inf, -np.inf], np.nan, inplace=True)
    df.dropna(inplace=True)

    X = df.drop(['Label'], axis=1)
    y = df['Label']

    # Feature selection - use the most important features
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
    
    available_features = [col for col in feature_map.keys() if col in X.columns]
    X_selected = X[available_features]
    
    return X_selected, y, df, feature_map

def prepare_data_for_training(X, y):
    """Prepare data for training with encoding and scaling"""
    # Label encoding
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    
    # Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # SMOTE for balancing
    print("Applying SMOTE for data balancing...")
    smote = SMOTE(random_state=42)
    X_train_balanced, y_train_balanced = smote.fit_resample(X_train_scaled, y_train)
    
    print(f"Original distribution: {Counter(y_train)}")
    print(f"Balanced distribution: {Counter(y_train_balanced)}")
    
    return X_train_balanced, X_test_scaled, y_train_balanced, y_test, label_encoder, scaler

def train_multiple_models(X_train, y_train):
    """Train multiple machine learning models"""
    models = {
        'Random Forest': RandomForestClassifier(
            n_estimators=100,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        ),
        'Gradient Boosting': GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=6,
            random_state=42
        ),
        'Support Vector Machine': SVC(
            kernel='rbf',
            C=1.0,
            gamma='scale',
            random_state=42,
            probability=True
        ),
        'Logistic Regression': LogisticRegression(
            max_iter=1000,
            random_state=42,
            solver='liblinear'
        ),
        'K-Nearest Neighbors': KNeighborsClassifier(
            n_neighbors=5,
            weights='distance'
        ),
        'Naive Bayes': GaussianNB()
    }
    
    trained_models = {}
    
    print("Training multiple models...")
    for name, model in models.items():
        print(f"Training {name}...")
        try:
            model.fit(X_train, y_train)
            trained_models[name] = model
            print(f"✓ {name} trained successfully")
        except Exception as e:
            print(f"✗ Error training {name}: {e}")
    
    return trained_models

def evaluate_models(models, X_test, y_test, label_encoder):
    """Evaluate all trained models and return comprehensive metrics"""
    results = {}
    
    print("\nEvaluating models...")
    for name, model in models.items():
        print(f"Evaluating {name}...")
        
        # Predictions
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test) if hasattr(model, 'predict_proba') else None
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
        
        # ROC-AUC for multiclass
        try:
            if y_pred_proba is not None:
                roc_auc = roc_auc_score(y_test, y_pred_proba, multi_class='ovr', average='weighted')
            else:
                roc_auc = 0.0
        except:
            roc_auc = 0.0
        
        results[name] = {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1,
            'roc_auc': roc_auc,
            'predictions': y_pred,
            'probabilities': y_pred_proba
        }
        
        print(f"✓ {name} evaluation complete")
    
    return results

def display_results(results, label_encoder):
    """Display comprehensive comparison of all models"""
    print("\n" + "="*80)
    print("DDOS DETECTION MODEL COMPARISON RESULTS")
    print("="*80)
    
    # Create comparison table
    comparison_df = pd.DataFrame({
        'Model': list(results.keys()),
        'Accuracy (%)': [results[model]['accuracy'] * 100 for model in results.keys()],
        'Precision (%)': [results[model]['precision'] * 100 for model in results.keys()],
        'Recall (%)': [results[model]['recall'] * 100 for model in results.keys()],
        'F1-Score (%)': [results[model]['f1_score'] * 100 for model in results.keys()],
        'ROC-AUC': [results[model]['roc_auc'] for model in results.keys()]
    })
    
    # Sort by F1-score (descending)
    comparison_df = comparison_df.sort_values('F1-Score (%)', ascending=False)
    
    print("\nMODEL PERFORMANCE COMPARISON:")
    print("-" * 80)
    print(comparison_df.to_string(index=False, float_format='%.2f'))
    
    # Find best model
    best_model_name = comparison_df.iloc[0]['Model']
    best_results = results[best_model_name]
    
    print(f"\n🏆 BEST PERFORMING MODEL: {best_model_name}")
    print("-" * 50)
    print(f"• Accuracy: {best_results['accuracy']*100:.2f}%")
    print(f"• Precision: {best_results['precision']*100:.2f}%")
    print(f"• Recall: {best_results['recall']*100:.2f}%")
    print(f"• F1-Score: {best_results['f1_score']*100:.2f}%")
    print(f"• ROC-AUC: {best_results['roc_auc']:.3f}")
    
    return best_model_name, comparison_df

def analyze_feature_importance(best_model, models, X, feature_names):
    """Analyze feature importance for the best model"""
    print(f"\nFEATURE IMPORTANCE ANALYSIS")
    print("-" * 50)
    
    best_model_obj = models[best_model]
    
    if hasattr(best_model_obj, 'feature_importances_'):
        feature_importance = pd.DataFrame({
            'Feature': feature_names,
            'Importance': best_model_obj.feature_importances_
        }).sort_values('Importance', ascending=False)
        
        print("Top 10 Most Important Features:")
        for i, row in feature_importance.head(10).iterrows():
            print(f"{row['Feature']}: {row['Importance']:.4f}")
    else:
        print(f"Feature importance not available for {best_model}")

def save_best_model(best_model_name, models, scaler, label_encoder, feature_names):
    """Save the best performing model and associated artifacts"""
    model_path = 'best_ddos_model.pkl'
    scaler_path = 'ddos_scaler.pkl'
    encoder_path = 'label_encoder.pkl'
    features_path = 'feature_list.pkl'
    
    with open(model_path, 'wb') as f:
        pickle.dump(models[best_model_name], f)
    
    with open(scaler_path, 'wb') as f:
        pickle.dump(scaler, f)
    
    with open(encoder_path, 'wb') as f:
        pickle.dump(label_encoder, f)
    
    with open(features_path, 'wb') as f:
        pickle.dump(feature_names, f)
    
    print(f"\n✅ Best model ({best_model_name}) and artifacts saved successfully!")
    print(f"Model saved as: {model_path}")

def main():
    """Main function to run the complete model comparison pipeline"""
    print("Starting DDoS Detection Model Comparison Pipeline...")
    
    # Load and preprocess data
    X, y, df, feature_map = load_and_preprocess_data()
    if X is None:
        return
    
    # Prepare data for training
    X_train, X_test, y_train, y_test, label_encoder, scaler = prepare_data_for_training(X, y)
    
    # Train multiple models
    trained_models = train_multiple_models(X_train, y_train)
    
    if not trained_models:
        print("No models were trained successfully!")
        return
    
    # Evaluate all models
    results = evaluate_models(trained_models, X_test, y_test, label_encoder)
    
    # Display comprehensive results
    best_model_name, comparison_df = display_results(results, label_encoder)
    
    # Feature importance analysis
    feature_names = list(X.columns)
    analyze_feature_importance(best_model_name, trained_models, X, feature_names)
    
    # Save best model
    save_best_model(best_model_name, trained_models, scaler, label_encoder, feature_names)
    
    print(f"\n🎯 SUMMARY:")
    print(f"Trained and compared {len(trained_models)} machine learning models")
    print(f"Best performing model: {best_model_name}")
    print(f"Dataset size: {len(df)} samples across {len(set(y))} attack types")
    print(f"Features used: {len(feature_names)}")
    
    print("\nModel comparison complete! 🚀")

if __name__ == "__main__":
    main()