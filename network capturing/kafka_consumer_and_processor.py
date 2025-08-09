import json
from kafka import KafkaConsumer
from kafka.errors import NoBrokersAvailable
import time
from collections import defaultdict
import statistics
import pickle
import numpy as np
import os
import requests # <-- Import the requests library
from datetime import datetime

# --- Configuration ---
KAFKA_BROKER = 'localhost:9092'
KAFKA_TOPIC = 'network_traffic'
GROUP_ID = 'ddos-detector-group'
TIME_WINDOW = 5.0

# --- NEW: API Configuration ---
API_ENDPOINT = "http://127.0.0.1:8000/api/report-attack"

# --- ML Model Loading ---
MODEL_PATH = 'ddos_random_forest_model.pkl'
SCALER_PATH = 'ddos_scaler.pkl'
FEATURE_LIST_PATH = 'feature_list.pkl'

model, scaler, feature_list = None, None, None

if not all(os.path.exists(p) for p in [MODEL_PATH, SCALER_PATH, FEATURE_LIST_PATH]):
    print(f"Error: One or more model files are missing.")
    print(f"Please run the 'train_model.py' script first to generate all artifacts.")
    exit(1)

try:
    with open(MODEL_PATH, 'rb') as f: model = pickle.load(f)
    with open(SCALER_PATH, 'rb') as f: scaler = pickle.load(f)
    with open(FEATURE_LIST_PATH, 'rb') as f: feature_list = pickle.load(f)
    print("Successfully loaded ML model, scaler, and feature list.")
    print(f"Model is expecting these features: {feature_list}")
except Exception as e:
    print(f"Error loading model artifacts: {e}")
    exit(1)

# --- Kafka Consumer Setup ---
try:
    consumer = KafkaConsumer(
        KAFKA_TOPIC,
        bootstrap_servers=KAFKA_BROKER,
        auto_offset_reset='latest',
        enable_auto_commit=True,
        group_id=GROUP_ID,
        value_deserializer=lambda x: json.loads(x.decode('utf-8'))
    )
    print(f"Successfully subscribed to Kafka topic '{KAFKA_TOPIC}'")
except Exception as e:
    print(f"Error connecting to Kafka: {e}")
    exit(1)

# --- Flow Aggregator and Feature Calculation ---
active_flows = defaultdict(dict)

def calculate_flow_features(flow_data):
    packets = flow_data.get('packets', [])
    if not packets: return None
    start_time = flow_data.get('start_time', flow_data.get('last_seen', 0))
    flow_duration = flow_data.get('last_seen', 0) - start_time
    if flow_duration < 0: flow_duration = 0
    packet_lengths = [p['len'] for p in packets]
    timestamps = sorted([p['timestamp'] for p in packets])
    inter_arrival_times = [timestamps[i] - timestamps[i-1] for i in range(1, len(timestamps))]
    return {
        'flow_duration': flow_duration, 'total_packets': len(packets), 'total_bytes': sum(packet_lengths),
        'min_packet_len': min(packet_lengths) if packet_lengths else 0,
        'max_packet_len': max(packet_lengths) if packet_lengths else 0,
        'mean_packet_len': statistics.mean(packet_lengths) if packet_lengths else 0,
        'std_packet_len': statistics.stdev(packet_lengths) if len(packet_lengths) > 1 else 0,
        'mean_inter_arrival_time': statistics.mean(inter_arrival_times) if inter_arrival_times else 0,
        'std_inter_arrival_time': statistics.stdev(inter_arrival_times) if len(inter_arrival_times) > 1 else 0,
        'max_inter_arrival_time': max(inter_arrival_times) if inter_arrival_times else 0,
    }

# --- NEW: Function to report attacks to the API ---
def report_attack_to_api(flow_key, flow_features):
    """Sends a POST request to the backend API to log an attack."""
    try:
        # The source IP is the first element in the flow key
        source_ip = flow_key[0]
        
        # Create the payload that matches the AttackLog model in the API
        payload = {
            "timestamp": datetime.utcnow().isoformat(),
            "source_ip": source_ip,
            "details": {
                "type": "DDoS Attack",
                "total_packets": flow_features.get('total_packets'),
                "total_bytes": flow_features.get('total_bytes'),
                "flow_duration": flow_features.get('flow_duration')
            }
        }
        
        response = requests.post(API_ENDPOINT, json=payload)
        if response.status_code == 200:
            print(f"Successfully reported attack from {source_ip} to API.")
        else:
            print(f"Failed to report attack. API responded with {response.status_code}.")
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the backend API. Is it running?")
    except Exception as e:
        print(f"An error occurred while reporting attack: {e}")

# --- Prediction Function ---
def predict_ddos(flow_features):
    if not all([model, scaler, feature_list]):
        return "Model not loaded"
    try:
        ordered_feature_values = [flow_features[feature] for feature in feature_list]
        feature_array = np.array(ordered_feature_values).reshape(1, -1)
        scaled_features = scaler.transform(feature_array)
        prediction_idx = model.predict(scaled_features)[0]
        
        # Assuming 0 is Benign and any other value is an attack
        return 'Benign' if prediction_idx == 0 else 'DDoS Attack Detected'
    except Exception as e:
        return f"Prediction Error: {e}"

# --- Main Processing Loop ---
def process_traffic_data():
    print("Starting real-time DDoS detection...")
    print("--------------------------------------")
    try:
        for message in consumer:
            packet = message.value
            flow_key = (packet.get('src_ip'), packet.get('src_port'), packet.get('dst_ip'), packet.get('dst_port'), packet.get('protocol'))
            flow = active_flows[flow_key]
            if 'packets' not in flow:
                flow['packets'] = []
                flow['start_time'] = packet.get('timestamp', time.time())
            flow['packets'].append(packet)
            flow['last_seen'] = packet.get('timestamp', time.time())
            
            current_time = time.time()
            expired_flows = [key for key, data in list(active_flows.items()) if current_time - data.get('last_seen', current_time) > TIME_WINDOW]
            
            for key in expired_flows:
                if key in active_flows:
                    flow_to_process = active_flows.pop(key)
                    if len(flow_to_process.get('packets', [])) > 1:
                        flow_features = calculate_flow_features(flow_to_process)
                        if flow_features:
                            prediction = predict_ddos(flow_features)
                            print(f"\n--- Processed Flow ---\nFlow Key: {key}\nPrediction: {prediction}\n----------------------\n")
                            
                            # --- NEW: Trigger API call on attack detection ---
                            if prediction == 'DDoS Attack Detected':
                                report_attack_to_api(key, flow_features)

    except KeyboardInterrupt:
        print("\nConsumer stopped by user.")
    finally:
        if consumer:
            consumer.close()
            print("Kafka consumer closed.")

if __name__ == "__main__":
    process_traffic_data()
