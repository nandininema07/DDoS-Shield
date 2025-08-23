import json
from kafka import KafkaConsumer
import time
from collections import defaultdict
import statistics
import pickle
import numpy as np
import os
import requests
from datetime import datetime
import threading

# --- Configuration ---
KAFKA_BROKER = 'localhost:9092'
KAFKA_TOPIC = 'network_traffic'
GROUP_ID = 'ddos-detector-group'
SETTINGS_API_URL = "http://127.0.0.1:8001/api/settings"
LOG_FLOW_API_ENDPOINT = "http://127.0.0.1:8000/api/log-flow"
REPORT_ATTACK_API_ENDPOINT = "http://127.0.0.1:8000/api/report-attack"
TIME_WINDOW = 5.0 
THRESHOLD_WINDOW = 10.0 

# --- DYNAMIC: Detection Threshold will be updated periodically ---
ATTACK_THRESHOLD = 50 
potential_attackers = defaultdict(lambda: {'count': 0, 'first_seen': time.time()})

# --- NEW: Function to periodically update settings ---
def update_settings():
    global ATTACK_THRESHOLD
    while True:
        try:
            response = requests.get(SETTINGS_API_URL)
            if response.ok:
                settings = response.json()
                new_threshold = settings['advanced']['ddosThreshold']
                if new_threshold != ATTACK_THRESHOLD:
                    ATTACK_THRESHOLD = new_threshold
                    print(f"✅ Updated DDoS Attack Threshold to: {ATTACK_THRESHOLD}")
        except requests.exceptions.RequestException:
            print("⚠️ Could not update settings. Using last known values.")
        
        time.sleep(30) # Check for new settings every 30 seconds

# --- ML Model Loading ---
MODEL_PATH = 'ddos_random_forest_model.pkl'
SCALER_PATH = 'ddos_scaler.pkl'
FEATURE_LIST_PATH = 'feature_list.pkl'
LABEL_ENCODER_PATH = 'label_encoder.pkl'

model, scaler, feature_list, label_encoder = None, None, None, None

if not all(os.path.exists(p) for p in [MODEL_PATH, SCALER_PATH, FEATURE_LIST_PATH, LABEL_ENCODER_PATH]):
    print("❌ Error: One or more model files are missing.")
    print("Please run the 'train_model.py' script first to generate all artifacts.")
    exit(1)

try:
    with open(MODEL_PATH, 'rb') as f: model = pickle.load(f)
    with open(SCALER_PATH, 'rb') as f: scaler = pickle.load(f)
    with open(FEATURE_LIST_PATH, 'rb') as f: feature_list = pickle.load(f)
    with open(LABEL_ENCODER_PATH, 'rb') as f: label_encoder = pickle.load(f)
    print("✅ Successfully loaded ML model, scaler, feature list, and label encoder.")
except Exception as e:
    print(f"❌ Error loading model artifacts: {e}")
    exit(1)

# --- Kafka Consumer Setup ---
try:
    consumer = KafkaConsumer(
        KAFKA_TOPIC,
        bootstrap_servers=KAFKA_BROKER,
        auto_offset_reset='latest',
        group_id=GROUP_ID,
        value_deserializer=lambda x: json.loads(x.decode('utf-8'))
    )
    print(f"✅ Successfully subscribed to Kafka topic '{KAFKA_TOPIC}'")
except Exception as e:
    print(f"❌ Error connecting to Kafka: {e}")
    exit(1)

# --- Helper Functions ---

def calculate_flow_features(flow_data):
    """Calculates statistical features from a list of packets in a flow."""
    packets = flow_data.get('packets', [])
    if not packets: return None
    
    start_time = flow_data.get('start_time', 0)
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

def log_flow_to_api(source_ip, status, details):
    """Sends a POST request to the backend API to log every processed flow."""
    try:
        payload = {
            "timestamp": datetime.utcnow().isoformat(),
            "source_ip": source_ip,
            "status": status,
            "details": details
        }
        requests.post(LOG_FLOW_API_ENDPOINT, json=payload, timeout=5)
    except requests.exceptions.RequestException:
        # Silently fail if the backend is temporarily unavailable to avoid console spam
        pass

def report_attack_to_api(source_ip, details):
    """Sends a POST request to the backend API to log a CONFIRMED attack for notifications."""
    try:
        payload = {
            "timestamp": datetime.utcnow().isoformat(),
            "source_ip": source_ip,
            "details": details
        }
        response = requests.post(REPORT_ATTACK_API_ENDPOINT, json=payload, timeout=5)
        if response.status_code == 200:
            print(f"✅ Successfully reported confirmed attack from {source_ip} to API.")
        else:
            print(f"❌ Failed to report attack. API responded with {response.status_code}.")
    except requests.exceptions.RequestException as e:
        print(f"❌ Error reporting attack to API: {e}")

def predict_ddos(flow_features):
    """Makes a prediction on a feature set using the loaded ML model."""
    try:
        ordered_feature_values = [flow_features[feature] for feature in feature_list]
        feature_array = np.array(ordered_feature_values).reshape(1, -1)
        scaled_features = scaler.transform(feature_array)
        prediction_idx = model.predict(scaled_features)[0]
        prediction_label = label_encoder.inverse_transform([prediction_idx])[0]
        return prediction_label
    except Exception as e:
        print(f"Prediction error: {e}")
        return 'Prediction Error'

# --- Main Processing Loop ---
def process_traffic_data():
    """Main loop to consume from Kafka, process flows, and detect attacks."""
    print("🚀 Starting real-time DDoS detection with FULL FLOW LOGGING...")
    active_flows = defaultdict(dict)
    
    try:
        for message in consumer:
            packet = message.value
            if not all(k in packet for k in ['src_ip', 'src_port', 'dst_ip', 'dst_port', 'protocol', 'timestamp']):
                continue

            flow_key = (packet['src_ip'], packet['src_port'], packet['dst_ip'], packet['dst_port'], packet['protocol'])
            
            flow = active_flows[flow_key]
            if 'packets' not in flow:
                flow['packets'] = []
                flow['start_time'] = packet['timestamp']
            
            flow['packets'].append(packet)
            flow['last_seen'] = packet['timestamp']

            current_time = time.time()
            
            flows_to_process = [
                key for key, data in list(active_flows.items()) 
                if (current_time - data.get('last_seen', 0) > TIME_WINDOW) or \
                   (current_time - data.get('start_time', 0) > TIME_WINDOW)
            ]
            
            for key in flows_to_process:
                if key in active_flows:
                    flow_to_process = active_flows.pop(key)
                    
                    if len(flow_to_process.get('packets', [])) > 1:
                        flow_features = calculate_flow_features(flow_to_process)
                        
                        if flow_features:
                            prediction = predict_ddos(flow_features)
                            source_ip = key[0]

                            # Log every single flow (benign or malicious) to the database
                            log_flow_to_api(source_ip, prediction, flow_features)

                            if prediction != 'Benign':
                                # Apply threshold logic only to malicious predictions
                                attacker = potential_attackers[source_ip]
                                attacker['count'] += 1
                                
                                if current_time - attacker['first_seen'] > THRESHOLD_WINDOW:
                                    attacker['first_seen'] = current_time
                                    attacker['count'] = 1
                                
                                if attacker['count'] > ATTACK_THRESHOLD:
                                    print(f"\n🚨🚨🚨 DDoS ATTACK CONFIRMED FROM {source_ip} 🚨🚨🚨")
                                    print(f"Malicious flows: {attacker['count']} in under {THRESHOLD_WINDOW}s.")
                                    
                                    report_details = flow_features.copy()
                                    report_details['type'] = prediction
                                    
                                    # Only report confirmed attacks for notifications
                                    report_attack_to_api(source_ip, report_details)
                                    attacker['count'] = 0 

    except KeyboardInterrupt:
        print("\nConsumer stopped by user.")
    finally:
        if consumer:
            consumer.close()
            print("Kafka consumer closed.")

if __name__ == "__main__":
    # --- NEW: Start the settings updater thread ---
    settings_updater_thread = threading.Thread(target=update_settings, daemon=True)
    settings_updater_thread.start()

    print("Waiting for initial settings configuration...")
    time.sleep(2) # Give it a moment to fetch the first time

    process_traffic_data()