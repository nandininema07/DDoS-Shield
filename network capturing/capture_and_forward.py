import socket
import threading
from kafka import KafkaProducer
from kafka.errors import NoBrokersAvailable
import json
import time
from scapy.all import sniff, IP, TCP

# --- Configuration ---
PROXY_IP = "0.0.0.0"  # Listen on all available interfaces
PROXY_PORT = 80       # Port to listen on (e.g., 80 for HTTP)
ORIGIN_SERVER_IP = "52.74.6.109" # The IP for your Netlify test site
ORIGIN_SERVER_PORT = 80

# The network interface to sniff on for Kafka logging.
INTERFACE = "\\Device\\NPF_{5DF8F02E-33C1-48D0-A743-9CD1FEEBAAD4}"

# Kafka configuration
KAFKA_BROKER = 'localhost:9092'
KAFKA_TOPIC = 'network_traffic'

# --- Kafka Producer Setup ---
producer = None
try:
    producer = KafkaProducer(
        bootstrap_servers=KAFKA_BROKER,
        value_serializer=lambda v: json.dumps(v).encode('utf-8'),
        api_version=(0, 10, 1) # Explicitly set for compatibility
    )
    print("Successfully connected to Kafka broker.")
except NoBrokersAvailable as e:
    print(f"Error: Could not connect to Kafka broker at {KAFKA_BROKER}. Please ensure Kafka is running.")
    print(f"Details: {e}")
    exit(1)
except Exception as e:
    print(f"An unexpected error occurred connecting to Kafka: {e}")
    exit(1)

# --- Scapy Packet Logging (Runs in a separate thread) ---
def packet_to_dict(packet):
    """Converts a Scapy packet to a dictionary for JSON serialization."""
    if packet.haslayer(IP):
        return {
            'timestamp': time.time(),
            'src_ip': packet[IP].src,
            'dst_ip': packet[IP].dst,
            'protocol': packet[IP].proto,
            'len': packet[IP].len,
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
        except Exception as e:
            # Avoid printing errors for every packet to prevent flooding the console
            pass

def start_kafka_sniffer():
    """Starts the Scapy sniffer in a background thread to log all traffic."""
    print(f"Starting Kafka traffic logger on interface '{INTERFACE}'...")
    try:
        # Sniff all TCP traffic on the interface for logging purposes
        sniff(iface=INTERFACE, filter="tcp", prn=log_packet_to_kafka, store=0)
    except Exception as e:
        print(f"\nAn error occurred in the Kafka sniffer thread: {e}")

# --- Socket-based Proxy Logic ---
def forward_data(source_socket, dest_socket):
    """Reads data from one socket and sends it to another."""
    try:
        while True:
            data = source_socket.recv(4096)
            if not data:
                break
            dest_socket.sendall(data)
    except ConnectionResetError:
        print("Client connection was forcibly closed.")
    except Exception as e:
        # Silently handle other socket errors that occur during shutdown
        pass
    finally:
        source_socket.close()
        dest_socket.close()

def handle_client(client_socket):
    """Handles a new client connection by forwarding it to the origin server."""
    try:
        # Create a new socket to connect to the origin server
        origin_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        origin_socket.connect((ORIGIN_SERVER_IP, ORIGIN_SERVER_PORT))
        print(f"Proxying new connection to {ORIGIN_SERVER_IP}:{ORIGIN_SERVER_PORT}")

        # Start two-way forwarding in separate threads
        # Client -> Origin
        threading.Thread(target=forward_data, args=(client_socket, origin_socket)).start()
        # Origin -> Client
        threading.Thread(target=forward_data, args=(origin_socket, client_socket)).start()

    except Exception as e:
        print(f"Error handling client: {e}")
        client_socket.close()

def start_proxy_server():
    """Starts the main proxy server to accept client connections."""
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind((PROXY_IP, PROXY_PORT))
    server.listen(5) # Allow up to 5 queued connections
    print(f"Proxy server listening on {PROXY_IP}:{PROXY_PORT}")

    while True:
        client_socket, addr = server.accept()
        print(f"Accepted connection from {addr[0]}:{addr[1]}")
        # Handle each client in a new thread
        client_thread = threading.Thread(target=handle_client, args=(client_socket,))
        client_thread.start()

# --- Main Execution ---
if __name__ == "__main__":
    try:
        # Start the Scapy sniffer in the background
        sniffer_thread = threading.Thread(target=start_kafka_sniffer, daemon=True)
        sniffer_thread.start()

        # Start the proxy server in the main thread
        start_proxy_server()

    except KeyboardInterrupt:
        print("\nShutting down proxy server.")
    except Exception as e:
        print(f"\nA fatal error occurred: {e}")
    finally:
        if producer:
            producer.flush()
            producer.close()
            print("Kafka producer closed.")
