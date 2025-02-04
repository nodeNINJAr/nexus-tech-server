
# **Nexus Tech – Server**  

## 🚀 Introduction  

The **Nexus Tech Server** is the backend for the **Nexus Tech Employee Management System (EMS)**. It provides robust APIs for managing employees, handling authentication, processing payments, and interacting with the database.  

This backend is built using **Node.js** and **Express**, with **MongoDB** as the database. It ensures **secure authentication** with **JWT**, manages **real-time data**, and integrates **Stripe** for payment processing.  

---

## 📑 Table of Contents  

- [**Nexus Tech – Server**](#nexus-tech--server)
  - [🚀 Introduction](#-introduction)
  - [📑 Table of Contents](#-table-of-contents)
  - [🌟 Features](#-features)
  - [🛠 Tech Stack](#-tech-stack)
  - [📥 Installation](#-installation)
    - [**Prerequisites**](#prerequisites)
    - [**Steps**](#steps)
  - [▶️ Usage](#️-usage)
  - [📜 Available Scripts](#-available-scripts)
  - [⚙️ Environment Variables](#️-environment-variables)
    - [**MongoDB Connection**](#mongodb-connection)
  - [🔗 API Endpoints](#-api-endpoints)
    - [**Authentication**](#authentication)
    - [**Employee Management**](#employee-management)
    - [**Payment Processing**](#payment-processing)
    - [**AI-Powered Features**](#ai-powered-features)
  - [🛠 Troubleshooting](#-troubleshooting)

---

## 🌟 Features  

✅ **User Authentication** – Secure login & signup with JWT-based authentication.  
✅ **Employee Management** – Manage employee records, attendance, and HR-related data.  
✅ **Role-Based Access Control (RBAC)** – Secure different access levels for admins, HR, and employees.  
✅ **Database Management** – Uses MongoDB for efficient and scalable data storage.  
✅ **Secure API Communication** – Implements CORS, cookie-parser, and dotenv for secure data flow.  
✅ **Payment Integration** – Processes transactions securely using **Stripe**.  
✅ **Google Gemini AI Integration** – Leverages **Google AI API** for smart automation.  
✅ **Logging & Monitoring** – Uses **Morgan** for detailed request logging.  

---

## 🛠 Tech Stack  

| Technology  | Purpose |
|-------------|---------|
| **Node.js**   | JavaScript Runtime |
| **Express.js** | Web Framework |
| **MongoDB** | NoSQL Database |
| **JWT (jsonwebtoken)** | Authentication |
| **Stripe API** | Payment Processing |
| **Google Gemini AI API** | AI-powered automation |
| **Dotenv** | Environment Configuration |
| **Morgan** | HTTP Request Logging |
| **CORS** | Cross-Origin Requests Handling |

---

## 📥 Installation  

### **Prerequisites**  

- **Node.js (>=16.0.0)**  
- **MongoDB Atlas or Local MongoDB Instance**  

### **Steps**  

1. Clone the repository:  
   ```sh
   git clone https://github.com/nodeNINJAr/nexus-tech-server
   cd nexus-tech-server
   ```  
2. Install dependencies:  
   ```sh
   npm install
   ```  
3. Create a `.env` file and configure the environment variables (see [Environment Variables](#-environment-variables)).  
4. Start the development server:  
   ```sh
   npm run dev
   ```  

---

## ▶️ Usage  

- **Start the production server:**  
  ```sh
  npm start
  ```  
- **Start the development server with live reload:**  
  ```sh
  npm run dev
  ```  

---

## 📜 Available Scripts  

| Command | Description |
|---------|-------------|
| `npm start` | Start the production server |
| `npm run dev` | Start the server with Nodemon for live reload |

---

## ⚙️ Environment Variables  

Create a `.env` file in the root directory and configure the following:  

```env
PORT=5000

# MongoDB Database
DB_USER=your-db-username
DB_PASS=your-db-password
MONGODB_URI=mongodb+srv://$(DB_USER):$(DB_PASS)@cluster.mongodb.net/nexus-tech?retryWrites=true&w=majority

# Authentication
JWT_SECRET_KEY=your-secret-key

# Stripe Payment Integration
STRIPE_SECRET=your-stripe-secret-key

# Google Gemini AI API
GEMINI_API_KEY=your-google-gemini-api-key
```

### **MongoDB Connection**  

Ensure your **MongoDB URI** is correctly configured in your `.env` file.  
For local MongoDB, use:  
```env
MONGODB_URI=mongodb://localhost:27017/nexus-tech
```

For **MongoDB Atlas**, replace it with your cloud connection string.

---

## 🔗 API Endpoints  

### **Authentication**  

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login user & generate JWT |
| `GET` | `/api/auth/user` | Get user profile |

### **Employee Management**  

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/employees` | Get all employees |
| `POST` | `/api/employees` | Add a new employee |
| `PUT` | `/api/employees/:id` | Update employee details |
| `DELETE` | `/api/employees/:id` | Remove an employee |

### **Payment Processing**  

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payments/create` | Create a new payment session |
| `GET` | `/api/payments/status` | Check payment status |

### **AI-Powered Features**  

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/generate-summary` | Generate employee performance summary using Gemini AI |
| `POST` | `/api/ai/automate-tasks` | AI-powered HR task automation |

For full API documentation, refer to `api-docs.md` (if available).

---

## 🛠 Troubleshooting  

- **Server Not Starting?**  
  Ensure **MongoDB** is running and your `.env` variables are set up correctly.  

- **CORS Issues?**  
  Update your `cors` configuration in `index.js`:  
  ```js
  app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
  }));
  ```  

- **Invalid JWT Token?**  
  - Make sure the token is correctly passed in the Authorization header.  
  - Check if `JWT_SECRET_KEY` is correctly set in `.env`.  

- **Google Gemini API Not Working?**  
  - Ensure `GEMINI_API_KEY` is correctly set in `.env`.  
  - Verify that your Google AI API quota is not exceeded.  
