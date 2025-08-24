# Real-Time DDoS Detection and Mitigation Shield

## 📜 Problem Statement

Distributed Denial of Service (DDoS) attacks are a critical threat to the availability of websites and online services. These attacks overwhelm a server with a flood of malicious traffic, rendering it inaccessible to legitimate users. Traditional signature-based detection systems often struggle with modern, sophisticated attacks and can be slow to respond. Furthermore, during legitimate high-traffic events (like flash sales or festivals), these systems can generate false alarms, leading to unnecessary alerts and potential disruption. There is a need for an intelligent, adaptive system that can accurately distinguish between legitimate traffic spikes and malicious DDoS attacks in real-time.

---

## 💡 Solution Overview

This project implements an end-to-end, real-time DDoS detection and response system that leverages machine learning to analyze live network traffic. The system acts as a protective proxy, inspecting all incoming traffic, making intelligent predictions, and taking automated actions to mitigate threats.

The core architecture follows a modern data streaming pipeline:

1. **Live Traffic Capture**: A high-performance proxy captures all network packets destined for the user's website.

2. **Data Streaming**: This raw packet data is published to a real-time **Apache Kafka** message queue.

3. **Feature Engineering & ML Inference**: A consumer service reads from the Kafka stream, aggregates packets into network flows, and calculates statistical features. These features are fed into a pre-trained **Logistic Regression** model to predict if a flow is `Benign` or a specific `DDoS Attack` type.

4. **Backend & Database**: Two **FastAPI** backend services are used. The main API receives attack reports, logs all traffic, and serves dashboard data. A separate authentication API handles user registration, login, and settings management. All data is stored in a **PostgreSQL** database.

5. **Automated Alerts**: Upon detecting a new malicious IP, the system automatically triggers real-time alerts via **Email (SMTP)** and a **Twilio Voice Call**.

6. **AI Protection Assistant**: A **Google Gemini**-powered chatbot is integrated into the backend, allowing users to query the security status (e.g., "How many attacks today?") in natural language.

---

## ✨ Key Features

* **Live Network Proxy**: Intercepts and analyzes traffic before it hits the user's server.
* **Real-Time ML Detection**: Uses a Logistic Regression model trained on multiple attack types from the CICDDoS2019 dataset for robust, generalized predictions.
* **Scalable Data Pipeline**: Built with Apache Kafka to handle high volumes of traffic data.
* **Persistent Storage**: All traffic flows, attack logs, user data, and chat history are stored permanently in a PostgreSQL database.
* **Instant Notifications**: Automated email and voice call alerts ensure immediate notification of security events.
* **AI-Powered Chatbot**: Allows for intuitive, natural language queries about security logs and system status.
* **Dynamic Configuration**: System settings, such as the protected website URL and DDoS alert threshold, can be updated in real-time through the UI.

---

## 🛠️ Tech Stack

* **Backend**: Python, FastAPI
* **Machine Learning**: Scikit-learn, Pandas, NumPy
* **Data Streaming**: Apache Kafka
* **Database**: PostgreSQL
* **Packet Capture**: Scapy
* **Notifications**: Twilio API, smtplib
* **AI Chatbot**: Google Gemini API
* **Containerization**: Docker, Docker Compose

---

## 🧠 Machine Learning Model

The detection engine uses a robust, production-grade machine learning pipeline designed for real-world DDoS detection. Here’s how it works:

### 1. Data Loading and Preparation 🧺

- **Automatic Download:** The CICDDoS2019 dataset is downloaded from Kaggle using the `kagglehub` library.
- **Multi-Attack Coverage:** Loads data from five different `.parquet` files (DNS, Syn, UDP, NTP, LDAP) to ensure the model learns to recognize a variety of DDoS attack types.
- **Efficient Sampling:** Randomly samples 15,000 rows from each file and combines them into a single master dataset (total 75,000 samples) for fast, memory-efficient training.

### 2. Data Cleaning and Preprocessing 🧼

- **Column Pruning:** Drops unnecessary columns (identifiers, timestamps) that don’t help the model.
- **Error Handling:** Removes rows with mathematical errors (infinity, NaN).
- **Label Encoding:** Converts text labels (e.g., "Benign", "DrDoS_DNS") into numeric codes for model compatibility.

### 3. Feature Selection and Data Splitting 🎯

- **Feature Selection:** Chooses 9 real-time-calculable features known to be strong DDoS indicators:
  - Fwd Packet Length Min
  - Total Fwd Packets
  - Fwd Packet Length Mean
  - Fwd Packet Length Std
  - Fwd Packet Length Max
  - Flow IAT Std
  - Flow IAT Mean
  - Flow Duration
  - Flow IAT Max
- **Data Splitting:** Divides the data into:
  - **Training Set (80%)**: For model learning and balancing.
  - **Test Set (20%)**: For final, unbiased performance evaluation.

### 4. Data Balancing ⚖️

- **Class Imbalance Detection:** Counts examples per attack type.
- **Over-sampling (SMOTE):** Uses the SMOTE algorithm to synthesize new examples for rare attack types, ensuring balanced learning across all classes.

### 5. Model Training and Evaluation 🏋️‍♂️

- **Model Comparison:** Trains and compares six models: Random Forest, Gradient Boosting, SVM, Logistic Regression, K-Nearest Neighbors, and Naive Bayes.

| Model                   | Accuracy (%) | Precision (%) | Recall (%) | F1-Score (%) | ROC-AUC |
|-------------------------|-------------|--------------|------------|--------------|---------|
| Gradient Boosting       | 95.37       | 95.61        | 95.37      | 95.34        | 1.00    |
| Random Forest           | 95.03       | 95.38        | 95.03      | 94.98        | 1.00    |
| K-Nearest Neighbors     | 94.95       | 95.06        | 94.95      | 94.94        | 0.99    |
| Support Vector Machine  | 79.81       | 85.03        | 79.81      | 79.90        | 0.98    |
| Logistic Regression     | 79.48       | 79.62        | 79.48      | 78.63        | 0.97    |
| Naive Bayes             | 63.77       | 79.22        | 63.77      | 60.82        | 0.95    |

- **Best Model:** Gradient Boosting Classifier achieved the highest performance.
- **Final Evaluation:** Reports accuracy, precision, recall, F1-score, and ROC-AUC on the test set.
- **Feature Importance:** Analyzes which features contribute most to detection.

### 📊 Latest Model Metrics

- **Best Model:** Gradient Boosting Classifier
- **Test Accuracy:** 95.37%
- **Test Precision:** 95.61%
- **Test Recall:** 95.37%
- **Test F1-Score:** 95.34%
- **Test ROC-AUC:** 0.996

**Top 5 Most Important Features:**
1. Fwd Packet Length Min
2. Total Fwd Packets
3. Fwd Packet Length Mean
4. Fwd Packet Length Std
5. Fwd Packet Length Max

**Result:**  
The model is balanced, robust, and ready for real-time DDoS detection across multiple attack types, as demonstrated by the comprehensive model comparison

---

## ⚙️ Setup and Installation

### Prerequisites

* Python 3.9+
* Docker and Docker Compose
* A Kaggle account with an API token (`kaggle.json`)
* A Google Gemini API Key
* Twilio account credentials and a Twilio phone number

### 1. Clone the Repository

```bash
git clone https://github.com/nandininema07/DDoS-Shield.git
cd DDoS-Shield
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

# JWT Secret Key
SECRET_KEY="a_very_secret_key_for_development"
```

### 3. Install Dependencies

Install all the required Python packages from the `requirements.txt` file.

```bash
pip install -r requirements.txt
```

### 4. Start and Initialize the Database

This is a two-step process to ensure a clean setup.

**a. Start the Docker Services:**  
Use Docker Compose to start the Kafka and PostgreSQL containers in the background.

```bash
docker-compose up -d
```

**b. Initialize the Database Tables:**  
Wait about 30 seconds for the PostgreSQL container to start up. Then, navigate to the `backend` directory and run the initialization script **once**.

```bash
cd backend
python init_db.py
```

You should see a success message. This creates all the necessary tables before the application starts.

### 5. Train the ML Model

Navigate back to the project root and run the training script. This will automatically download the datasets from Kaggle, train the multi-attack model, and save all the necessary `.pkl` files.

```bash
cd ..
python train_model.py
```

### 6. Resetting the Database (for Testing)
If you need to clear all logs and start fresh for testing, you can use the built-in reset endpoint or reset the Docker container.

Option A: Using the API Endpoint (Recommended)
Make sure your backend server is running, then run this command in a terminal:

```bash
curl -X POST [http://127.0.0.1:8000/api/reset-database](http://127.0.0.1:8000/api/reset-database)
```

Option B: Full Docker Reset
This will completely delete the database container and all its data.
```bash
docker stop ddos-postgres
docker rm ddos-postgres
docker volume prune -f
```

After running these commands, you must re-run the setup steps from 4a to initialize a new database. The correct sequence is:

(i) Start the new Docker container:
```bash
docker run --name ddos-postgres -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -e POSTGRES_DB=ddos_shield_db -p 5432:5432 -d postgres
```

(ii) Initialize the database by running your script. Make sure you're in the backend directory.
```bash
python init_db.py
```

(iii) Now, run your backend servers.
```bash
python run_backend.py
```

---

## 🚀 Running the Application

The system consists of five main services that must be run in separate terminals.

### Terminal 1: Start the Backend Servers

This script starts both the main API (port 8000) and the authentication API (port 8001).

```bash
# Navigate to the 'backend' directory
cd backend

# Run the server script
python run_backend.py
```

### Terminal 2: Start Frontend

```bash
cd frontend
npm run dev
```

### Terminal 3: Start the Network Capture & Forwarding

This script acts as the proxy, capturing live traffic and sending it to Kafka.

```bash
# Navigate to the 'network_capturing' directory
cd network_capturing

# Run the capture script
python capture_and_forward.py
```

### Terminal 4: Start the ML Consumer & Processor

This script reads from Kafka, makes predictions, and reports to the backend.

```bash
# In the same 'network_capturing' directory
python kafka_consumer_and_processor.py
```

### Terminal 5: Run DDoS Simulation to test

Navigate to the 'test' directory or wherever your simulator is

```bash
cd test
python ddos_simulator.py
```

Your system is now live. After signing up and configuring your website in the Settings tab, all traffic to `http://127.0.0.1:80` will be proxied, analyzed, and logged.