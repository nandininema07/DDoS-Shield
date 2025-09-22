import socket
import threading
from kafka import KafkaProducer
from kafka.errors import NoBrokersAvailable
import json
import time
from scapy.all import sniff, IP, TCP
import requests
from concurrent.futures import ThreadPoolExecutor

# --- Configuration ---
PROXY_IP = "0.0.0.0"
PROXY_PORT = 80
INTERFACE = "\\Device\\NPF_{5DF8F02E-33C1-48D0-A743-9CD1FEEBAAD4}" # Make sure this is correct for your system
KAFKA_BROKER = 'localhost:9092'
KAFKA_TOPIC = 'network_traffic'
SETTINGS_API_URL = "http://127.0.0.1:8001/api/settings"
GET_IP_API_URL = "http://127.0.0.1:8001/api/get-ip"
# --- NEW: Blacklist API Endpoint ---
BLACKLIST_API_URL = "http://127.0.0.1:8000/api/blacklist"

# --- Dynamic & Shared State ---
ORIGIN_SERVER_IP = None
ORIGIN_SERVER_PORT = 80
# --- NEW: In-memory set for fast blacklist lookups ---
BLACKLISTED_IPS = set()

# --- Dynamic Configuration Threads ---
def update_origin_server_ip():
    """Periodically fetches the protected website's IP from the settings API."""
    global ORIGIN_SERVER_IP
    while True:
        try:
            settings_res = requests.get(SETTINGS_API_URL, timeout=5)
            settings_res.raise_for_status()
            website_url = settings_res.json()['website']['url']
            
            ip_res = requests.post(GET_IP_API_URL, json={"url": website_url}, timeout=5)
            ip_res.raise_for_status()
            ip_data = ip_res.json()
            
            if ORIGIN_SERVER_IP != ip_data['ip_address']:
                ORIGIN_SERVER_IP = ip_data['ip_address']
                print(f"✅ Updated origin server IP to: {ORIGIN_SERVER_IP} for URL: {website_url}")

        except requests.exceptions.RequestException as e:
            print(f"⚠️ Could not update origin server IP. Using last known IP. Error: {e}")
        
        time.sleep(60)

def update_blacklist():
    """Periodically fetches the IP blacklist from the main backend API."""
    global BLACKLISTED_IPS
    while True:
        try:
            response = requests.get(BLACKLIST_API_URL, timeout=5)
            response.raise_for_status()
            blacklist_data = response.json()
            # Update the in-memory set for fast lookups
            BLACKLISTED_IPS = {item['ip_address'] for item in blacklist_data}
            if BLACKLISTED_IPS:
                 print(f"🔄 Blacklist updated. {len(BLACKLISTED_IPS)} IPs are currently blocked.")
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Could not update blacklist. Error: {e}")
        
        time.sleep(10) # Fetch updates every 10 seconds

# --- Kafka Producer Setup ---
try:
    producer = KafkaProducer(
        bootstrap_servers=KAFKA_BROKER,
        value_serializer=lambda v: json.dumps(v).encode('utf-8'),
        api_version=(0, 10, 1)
    )
    print("✅ Successfully connected to Kafka broker.")
except Exception as e:
    print(f"❌ Critical Error: Could not connect to Kafka broker at {KAFKA_BROKER}. Exiting.")
    exit(1)

# --- Scapy Packet Logging ---
def packet_to_dict(packet):
    """Converts a Scapy packet to a dictionary."""
    if packet.haslayer(IP):
        return {
            'timestamp': time.time(),
            'src_ip': packet[IP].src,
            'dst_ip': packet[IP].dst,
            'protocol': packet[IP].proto,
            'len': len(packet),
            'src_port': packet.sport if packet.haslayer(TCP) else None,
            'dst_port': packet.dport if packet.haslayer(TCP) else None,
        }
    return None

def log_packet_to_kafka(packet):
    """Callback function to send packet data to Kafka."""
    packet_data = packet_to_dict(packet)
    if packet_data and producer:
        try:
            producer.send(KAFKA_TOPIC, packet_data)
        except Exception:
            pass # Suppress errors to avoid console flooding

def start_kafka_sniffer():
    """Starts the Scapy sniffer in a background thread."""
    print(f"🔎 Starting Kafka traffic logger on interface '{INTERFACE}'...")
    try:
        # Sniff all TCP and UDP traffic for comprehensive logging
        sniff(iface=INTERFACE, filter="tcp or udp", prn=log_packet_to_kafka, store=0)
    except Exception as e:
        print(f"❌ An error occurred in the Kafka sniffer thread: {e}")

# --- Resilient Socket-based Proxy Logic ---
def forward_data(source_socket, dest_socket):
    """Reads data from one socket and forwards it to another."""
    try:
        while True:
            data = source_socket.recv(4096)
            if not data:
                break
            dest_socket.sendall(data)
    except (ConnectionResetError, BrokenPipeError):
        # These errors are expected when connections are closed abruptly during an attack
        pass
    except Exception:
        # Log unexpected errors if necessary, but avoid printing for performance
        pass
    finally:
        source_socket.close()
        dest_socket.close()

def handle_client(client_socket, client_address):
    """Forwards a legitimate client connection to the origin server."""
    if ORIGIN_SERVER_IP is None:
        print("❓ Origin server IP not set. Dropping connection.")
        client_socket.close()
        return

    try:
        origin_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        origin_socket.connect((ORIGIN_SERVER_IP, ORIGIN_SERVER_PORT))
        
        # Start two-way forwarding
        threading.Thread(target=forward_data, args=(client_socket, origin_socket)).start()
        threading.Thread(target=forward_data, args=(origin_socket, client_socket)).start()
    except Exception as e:
        # print(f"Error handling client {client_address}: {e}")
        client_socket.close()

def start_proxy_server():
    """Starts the main proxy server with a thread pool and blacklist enforcement."""
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind((PROXY_IP, PROXY_PORT))
    server.listen(100) # Increase listen backlog
    print(f"🛡️  Proxy server listening on {PROXY_IP}:{PROXY_PORT}")

    # --- NEW: Use a ThreadPoolExecutor for resilience ---
    with ThreadPoolExecutor(max_workers=200) as executor:
        while True:
            client_socket, addr = server.accept()
            client_ip = addr[0]

            # --- NEW: Enforcement Plane Logic ---
            if client_ip in BLACKLISTED_IPS:
                print(f"🚫 Denied connection from blacklisted IP: {client_ip}")
                client_socket.close()
                continue # Immediately drop and wait for the next connection
            
            # If not blacklisted, handle the connection in the thread pool
            executor.submit(handle_client, client_socket, addr)

# --- Main Execution ---
if __name__ == "__main__":
    # Start background threads for dynamic configuration
    threading.Thread(target=update_origin_server_ip, daemon=True).start()
    threading.Thread(target=update_blacklist, daemon=True).start()

    print("⏳ Waiting for initial origin server IP configuration...")
    while ORIGIN_SERVER_IP is None:
        time.sleep(1)

    try:
        # Start the Scapy sniffer in its own background thread
        threading.Thread(target=start_kafka_sniffer, daemon=True).start()
        
        # Start the proxy server in the main thread
        start_proxy_server()

    except KeyboardInterrupt:
        print("\nShutting down proxy server.")
    except Exception as e:
        print(f"\n❌ A fatal error occurred: {e}")
    finally:
        if producer:
            producer.close()
            print("Kafka producer closed.")