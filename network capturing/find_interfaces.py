from scapy.all import get_if_list, get_if_addr, get_if_hwaddr

print("Finding available network interfaces...")
print("----------------------------------------")

interfaces = get_if_list()
print("All interfaces found:", interfaces)
print("\n--- Interface Details ---")

for iface in interfaces:
    try:
        ip = get_if_addr(iface)
        mac = get_if_hwaddr(iface)
        print(f"Interface: {iface}")
        print(f"  IP Address:  {ip}")
        print(f"  MAC Address: {mac}")
        print("---------------------------")
    except Exception as e:
        print(f"Interface: {iface} - Error getting details: {e}")
