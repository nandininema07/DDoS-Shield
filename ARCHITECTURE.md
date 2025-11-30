------



## **SYSTEM ARCHITECTURE: REAL-TIME DDoS DETECTION AND AUTOMATED MITIGATION**## **SYSTEM ARCHITECTURE: REAL-TIME DDoS DETECTION AND AUTOMATED MITIGATION**



------



### **1. FRONTEND (🟣)**### **1. FRONTEND (🟣)**



**Next.js Dashboard Interface****Next.js Dashboard & Real-time Monitoring**



* **Current Status Dashboard (Next.js/React)*** **Current Status Dashboard (`/app/(dashboard)/current-status/`)**

  * Live Traffic Monitoring (`/current-status`)  * Live Network Activity Chart (Recharts)

  * IP Blacklist Management View  * Traffic Log with IP Details

  * Real-time Activity Charts (Recharts)  * Status Filtering (DDoS/Flagged/Safe)

  * Traffic Logs with Status (DDoS/Flagged/Safe)  * IST Timezone Display

* **AI-Powered Security Chatbot**

  * Google Gemini-based Analysis* **AI-Powered Chatbot Integration**

  * Attack Pattern Recognition  * Google Gemini-based Natural Language Processing

  * Historical Attack Querying  * Direct API Integration with Attack Logs

* **Settings Management**  * Contextual Security Insights

  * DDoS Threshold Configuration

  * Alert Preferences (Email/Call)* **User Authentication & Settings**

  * Protected Website Configuration  * DDoS Threshold Configuration

  * Email/Phone Alert Preferences

---  * Website URL Protection Settings



### **2. DATA INGESTION LAYER (🟡)**---



**Network Traffic Capture & Preprocessing**### **2. DATA INGESTION LAYER (🟡)**



* **Scapy-based Network Sniffer****Network Traffic Capture & Inline Protection**

  * Live TCP/UDP Packet Capture

  * Interface-level Traffic Monitoring* **Scapy-based Packet Sniffer (`capture_and_forward.py`)**

  * Real-time Flow Metadata Extraction  * Real-time TCP/UDP Packet Capture

* **Inline Protection Proxy**  * JSON Packet Metadata:

  * Socket-based TCP Forwarding    ```json

  * Real-time Blacklist Enforcement    {

  * Origin Server Auto-discovery      "timestamp": 1699123456.789,

* **Kafka Publisher**      "src_ip": "1.2.3.4",

  * Topic: `network_traffic`      "dst_ip": "5.6.7.8",

  * Packet Metadata Standardization      "protocol": 6,

  * High-throughput Event Streaming      "len": 64,

      "src_port": 12345,

---      "dst_port": 80

    }

### **3. MESSAGE STREAMING LAYER (🟡)**    ```



**Kafka-based Event Processing*** **Inline Protection Proxy**

  * Socket-based TCP Forwarding

* **Apache Kafka Infrastructure**  * Real-time Blacklist Enforcement

  * High-throughput Message Broker  * Origin Server Auto-discovery

  * Topic: `network_traffic`

  * Consumer Group: `ddos-detector-group`* **Kafka Producer Integration**

* **Flow Processing**  * Topic: `network_traffic`

  * Time-windowed Flow Assembly  * High-throughput Packet Streaming

  * Stream Processing Pipeline  * Error-resilient Publishing

  * Packet Aggregation Logic

---

---

### **3. MESSAGE STREAMING LAYER (🟡)**

### **4. MACHINE LEARNING INFERENCE LAYER (🟢)**

**Kafka-based Event Stream Processing**

**Real-time Flow Classification**

* **Apache Kafka Infrastructure**

* **Flow Feature Extractor**  * Broker: `localhost:9092`

  * Flow Duration Analysis  * Primary Topic: `network_traffic`

  * Packet/Byte Statistics  * Consumer Group: `ddos-detector-group`

  * Inter-arrival Time Patterns

  * Length Distribution Metrics* **Stream Processing Features**

* **ML Model Pipeline**  * Flow-based Packet Aggregation

  * Pre-trained Classifier (`best_ddos_model.pkl`)  * Configurable Time Windows (5s default)

  * Feature Scaling (`ddos_scaler.pkl`)  * Auto-offset Management

  * Attack Type Classification

* **Real-time Detection**---

  * Dynamic Threshold Monitoring

  * Time-window Analysis### **4. MACHINE LEARNING INFERENCE LAYER (🟢)**

  * Attack Pattern Recognition

**Real-time Flow Classification**

---

* **Feature Engineering (`kafka_consumer_and_processor.py`)**

### **5. MITIGATION AND RESPONSE SYSTEM (🔵)**  * Statistical Flow Features:

    * Flow Duration

**Automated Protection Workflow**    * Packet Counts

    * Byte Totals

* **Attack Validation**    * Inter-arrival Statistics

  * Dynamic Threshold-based Confirmation    * Packet Length Distribution

  * Source IP Tracking

  * False Positive Prevention* **ML Model Integration**

* **Blacklist Management**  * Pre-trained Model: `best_ddos_model.pkl`

  * Real-time IP Blocking  * Feature Scaling: `ddos_scaler.pkl`

  * Proxy Synchronization  * Label Encoding: `label_encoder.pkl`

  * Atomic Database Updates

* **Alert System*** **Attack Detection Logic**

  * SMTP Email Notifications  * Dynamic Thresholding

  * Twilio Voice Call Alerts  * Time-window Based Analysis

  * Background Task Processing  * Multi-type Attack Classification

* **Async Handlers**

  * Non-blocking Alert Dispatch---

  * Concurrent Flow Processing

  * Event-driven Architecture### **5. MITIGATION AND RESPONSE SYSTEM (🔵)**



---**Automated Protection & Alerting**



### **6. ANALYTICS & VISUALIZATION (🟠)*** **Attack Validation (`backend_api.py`)**

  * Configurable DDoS Threshold

**Real-time Monitoring & Analysis**  * Per-IP Attack Counting

  * Time-window Based Confirmation

* **Dashboard Visualization**

  * Live Network Activity Charts* **Alert Dispatcher**

  * Attack Distribution Analysis  * Email Notifications (Gmail SMTP)

  * Traffic Pattern Visualization  * Twilio Voice Calls

* **Flow Analysis**  * Background Task Processing

  * Historical Flow Records

  * Attack Type Distribution* **Blacklist Management**

  * Source IP Analytics  * Atomic Database Updates

* **AI-powered Insights**  * Real-time Proxy Synchronization

  * Natural Language Querying  * IP Unblocking API

  * Attack Pattern Analysis

  * Threat Intelligence Reports---



---### **6. MONITORING AND ANALYTICS (🟠)**



### **7. DATABASE & STORAGE (🔴)****Real-time Dashboards & Insights**



**PostgreSQL-based Data Store*** **Live Activity Monitoring**

  * Traffic Rate vs Threshold

* **Core Database Tables**  * Attack Distribution Charts

  * Flow Logs (Traffic Records)  * Source IP Analytics

  * Attack Logs (Confirmed DDoS)

  * IP Blacklist (Blocked Sources)* **Traffic Log Analysis**

  * Chat Messages (Bot Interactions)  * Full Flow History

  * User Settings & Preferences  * ML Classification Results

* **Model Artifacts**  * Attack Pattern Recognition

  * Trained ML Models

  * Feature Scalers* **Chatbot Analytics**

  * Label Encoders  * Natural Language Querying

* **Attack Records**  * Attack Summary Generation

  * Source IP Tracking  * Trend Analysis

  * Attack Type Classification

  * Alert Status Monitoring---



---### **7. DATABASE LAYER (🔴)**



### **8. INFRASTRUCTURE & DEPLOYMENT (⚫)****PostgreSQL-based Persistence**



**Development Environment*** **Core Tables**

  ```sql

* **API Services**  flow_logs (

  * Main FastAPI (4 Workers)    id, timestamp, source_ip, 

  * Auth API Service    status, details jsonb

  * Chatbot Integration  )

* **Message Queue**  

  * Local Kafka Broker  attack_logs (

  * Topic Management    id, timestamp, source_ip,

  * Consumer Groups    details jsonb,

* **Development Tools**    email_status, call_status

  * Python FastAPI Backend  )

  * Next.js Frontend  

  * PostgreSQL Database  blacklist (

  * Kafka Message Queue    id, ip_address, reason, 

    timestamp

---  )

  

### **PIPELINE FLOW OVERVIEW**  chat_messages (

    id, role, content, timestamp

1. **Packet Capture**  )

   * Scapy Interface Monitoring → Packet Metadata Extraction  

   * Real-time Proxy Enforcement ← Blacklist Updates  users (

    id, username, email, phone_number,

2. **Stream Processing**    website_url, ddos_threshold,

   * Kafka Producer → Message Queue    email_alerts, phone_alerts

   * Consumer Groups → Flow Assembly  )

   * Feature Extraction → ML Classification  ```



3. **Protection & Response*** **Data Retention**

   * Attack Detection → Database Logging  * Flow Logs: Recent Activity

   * Alert Generation → Email/Voice Notifications  * Attack Logs: Full History

   * Blacklist Updates → Proxy Enforcement  * Blacklist: Active Blocks



4. **Visualization & Analysis**---

   * Real-time Monitoring → Dashboard Updates

   * Traffic Analysis → Pattern Recognition### **8. DEPLOYMENT ARCHITECTURE (⚫)**

   * User Queries → AI-powered Insights
**Development & Production Setup**

* **Backend Services**
  * Main API: `localhost:8000` (4 workers)
  * Auth API: `localhost:8001` (reload mode)
  * Kafka Broker: `localhost:9092`

* **Required Environment Variables**
  ```
  SENDER_EMAIL=...
  APP_PASSWORD=...
  ADMIN_EMAIL=...
  TWILIO_ACCOUNT_SID=...
  TWILIO_AUTH_TOKEN=...
  TWILIO_PHONE=...
  ADMIN_PHONE=...
  GEMINI_API_KEY=...
  ```

* **Development Tools**
  * Python FastAPI Backend
  * Next.js Frontend
  * PostgreSQL Database
  * Kafka Message Queue

---

### **PIPELINE FLOW OVERVIEW**

1. **Edge Capture & Protection**
   * Scapy Packet Capture → Kafka Producer
   * Proxy Enforcement ← Blacklist Updates

2. **Stream Processing & ML**
   * Kafka Consumer → Flow Assembly
   * Feature Extraction → ML Prediction
   * Threshold Analysis → Attack Detection

3. **Response & Visualization**
   * Attack Detection → Database Logging
   * Alert Generation → Email/Voice Notifications
   * Real-time Updates → Dashboard Display

4. **Analytics & Management**
   * Traffic Analysis → Chart Generation
   * User Queries → Chatbot Insights
   * Settings Management → System Configuration

---

### **CRITICAL PATHS & FAILURE MODES**

1. **Capture Resilience**
   * Kafka Producer Buffering
   * Proxy Failsafe Modes
   * Interface Auto-recovery

2. **Processing Reliability**
   * Consumer Group Management
   * Model Loading Validation
   * Feature Computation Safety

3. **Response Guarantees**
   * Background Task Retries
   * Notification Fallbacks
   * Database Transaction Safety

4. **UI/UX Stability**
   * API Error Handling
   * Polling/Refresh Logic
   * State Management