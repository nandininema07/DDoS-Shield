# Real-Time DDoS Detection and Mitigation Shield

## 📜 Problem Statement

Distributed Denial of Service (DDoS) attacks are a critical threat to the availability of websites and online services. These attacks overwhelm a server with a flood of malicious traffic, rendering it inaccessible to legitimate users. Traditional signature-based detection systems often struggle with modern, sophisticated attacks and can be slow to respond. Furthermore, during legitimate high-traffic events (like flash sales or festivals), these systems can generate false alarms, leading to unnecessary alerts and potential disruption. There is a need for an intelligent, adaptive system that can accurately distinguish between legitimate traffic spikes and malicious DDoS attacks in real-time.

---

## 💡 Solution Overview

This project implements an end-to-end, real-time DDoS detection and response system that leverages machine learning to analyze live network traffic. The system acts as a protective proxy, inspecting all incoming traffic, making intelligent predictions, and taking automated actions to mitigate threats.

The core architecture follows a modern data streaming pipeline:

1. **Live Traffic Capture**: A high-performance proxy captures all network packets destined for the user's website.
2. **Data Streaming**: This raw packet data is published to a real-time **Apache Kafka** message queue.
3. **Feature Engineering & ML Inference**: A consumer service reads from the Kafka stream, aggregates packets into network flows, and calculates statistical features. These features are fed into a pre-trained **Random Forest** model to predict if a flow is `Benign` or part of a `DDoS Attack`.
4. **Backend & Database**: A **FastAPI** backend receives reports of detected attacks. It logs the attack details into a **PostgreSQL** database and adds the malicious IP to a blacklist.
5. **Automated Alerts**: Upon detecting a new malicious IP, the system automatically triggers real-time alerts via **Email (SMTP)** and a **Twilio Voice Call**.
6. **AI Protection Assistant**: A **Google Gemini**-powered chatbot is integrated into the backend, allowing users to query the security status (e.g., "How many attacks today?") in natural language.

---

## ✨ Key Features

- **Live Network Proxy**: Intercepts and analyzes traffic before it hits the user's server.
- **Real-Time ML Detection**: Uses a Random Forest model trained on the CICDDoS2019 dataset for high-accuracy predictions.
- **Scalable Data Pipeline**: Built with Apache Kafka to handle high volumes of traffic data.
- **Persistent Storage**: All attack logs and blacklisted IPs are stored permanently in a PostgreSQL database.
- **Instant Notifications**: Automated email and voice call alerts ensure immediate notification of security events.
- **AI-Powered Chatbot**: Allows for intuitive, natural language queries about security logs and system status.
- **Modular & Asynchronous**: Each component (capture, processing, backend) runs as an independent service for scalability and resilience.

---

## 🛠️ Tech Stack

- **Backend**: Python, FastAPI
- **Machine Learning**: Scikit-learn, Pandas, NumPy
- **Data Streaming**: Apache Kafka
- **Database**: PostgreSQL
- **Packet Capture**: Scapy
- **Notifications**: Twilio API, smtplib
- **AI Chatbot**: Google Gemini API
- **Containerization**: Docker, Docker Compose

---

## ⚙️ Setup and Installation

### Prerequisites

- Python 3.9+
- Docker and Docker Compose
- A Kaggle account with an API token (`kaggle.json`)
- A Google Gemini API Key
- Twilio account credentials and a Twilio phone number

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ddos-detection-shield.git
cd ddos-detection-shield
```

### 2. Create the Environment File

Create a file named `.env` in the project root and populate it with your credentials.

```plaintext
# Email Credentials
SENDER_EMAIL="your_sender_email@gmail.com"
APP_PASSWORD="your_gmail_app_password"
ADMIN_EMAIL="your_admin_email@example.com"

# Twilio Credentials
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_PHONE="+15551234567"
ADMIN_PHONE="+919876543210"

# Gemini API Key
GEMINI_API_KEY="AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 3. Install Dependencies

Install all the required Python packages from the `requirements.txt` file.

```bash
pip install -r requirements.txt
```

### 4. Start Backend Services
Use Docker Compose to start the Kafka and PostgreSQL containers in the background.

```bash
docker-compose up -d
```

### 5. Train the ML Model
Run the training script. This will automatically download the dataset from Kaggle, train the model, and save the necessary .pkl files (ddos_random_forest_model.pkl, ddos_scaler.pkl, feature_list.pkl).

```bash
python train_model.py
```

---

## 🚀 Running the Application
The system consists of three main services that must be run in separate terminals.

### Terminal 1: Start the Backend API
This server handles data storage, notifications, and the chatbot. It must be run with multiple workers to handle concurrent requests from the chatbot.

```bash
# Navigate to the 'backend' directory
cd backend

# Run the Uvicorn server
uvicorn backend_api:app --host 127.0.0.1 --port 8000 --workers 4
```

### Terminal 2: Start the Network Capture & Forwarding
This script acts as the proxy, capturing live traffic and sending it to Kafka.

```bash
# Navigate to the 'network_capturing' directory
cd ../network_capturing

# Run the capture script
python capture_and_forward.py
```

### Terminal 3: Start the ML Consumer & Processor
This script reads from Kafka, performs feature engineering, makes predictions, and reports attacks to the backend API.

```bash
# In the same 'network_capturing' directory
python kafka_consumer_and_processor.py
```
Your system is now live. All traffic to http://127.0.0.1:80 will be proxied, analyzed, and logged.