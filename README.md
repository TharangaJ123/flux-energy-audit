# ⚡ Flux Energy Audit - Comprehensive Project Documentation

Welcome to **Flux Energy Audit**, a sophisticated web-based toolkit designed to empower users with energy literacy and sustainable consumption insights. This project utilizes the MERN stack (MongoDB, Express, React, Node.js) integrated with Google's Gemini AI to provide actionable intelligent recommendations.

---

## 📖 Table of Contents
1. [Setup Instructions](#-setup-instructions)
2. [API Endpoint Documentation](#-api-endpoint-documentation)
3. [Testing Instruction Report](#-testing-instruction-report)
4. [Deployment Report](#-deployment-report)

---

## 🚀 Setup Instructions

Follow these step-by-step instructions to get the Flux Energy Audit project running on your local development environment.

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: A local MongoDB instance (port 27017) or a MongoDB Atlas connection string
- **Git**: For version control

### 2. Repository Setup
Clone the repository to your local machine:
```bash
git clone <repository-url>
cd flux-energy-audit
```

### 3. Backend Configuration & Startup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install necessary Node.js dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `root` of your `backend/` folder and include the required environment variables:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/flux
   JWT_SECRET=your_super_secret_jwt_key
   GEMINI_API_KEY=your_google_gemini_api_key
   WEATHER_API_KEY=your_openweather_key
   NREL_API_KEY=your_nrel_api_key
   CLIMATIQ_API_KEY=your_climatiq_key
   NODE_ENV=development
   ```
4. Start the backend server in development mode:
   ```bash
   npm run dev
   ```
   *The backend should now be running on `http://localhost:5000`.*

### 4. Frontend Configuration & Startup
1. Open a new terminal window/tab and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Frontend Node.js dependencies:
   ```bash
   npm install
   ```
3. *(Optional)* Configure frontend environment variables. Create a `.env` file in the `frontend/` folder:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```
4. Start the React development server:
   ```bash
   npm start
   ```
   *The application will automatically open in your default browser at `http://localhost:3000`.*

---

## 🔌 API Endpoint Documentation

The Flux API follows RESTful architectural principles. It accepts and returns JSON payloads. Authentication is handled via JSON Web Tokens (JWT).

### **Authentication Requirements**
- Most endpoints require an `Authorization` header containing a valid Bearer token: `Authorization: Bearer <token>`
- User Registration and Login are publicly accessible.

### **1. User Management**

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/users/register` | Register a new user | No |
| `POST` | `/api/users/login` | Login and receive a JWT | No |
| `GET` | `/api/users/profile` | Get logged-in user's profile | Yes |

**Example Request: User Login (`POST /api/users/login`)**
```json
// Request Body
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```
**Example Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": "64f1a2...",
    "name": "Jane Doe",
    "email": "user@example.com"
  }
}
```

### **2. Appliance Management**

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/appliances` | Register a new appliance | Yes |
| `GET` | `/api/appliances` | List all appliances for user | Yes |
| `GET` | `/api/appliances/:id`| Retrieve specific appliance | Yes |
| `PUT` | `/api/appliances/:id`| Update appliance parameters | Yes |
| `DELETE`| `/api/appliances/:id`| Remove an appliance record | Yes |
| `GET` | `/api/appliances/audit`| Get weather-aware energy insights| Yes |
| `GET` | `/api/appliances/stats`| Get overall statistical summary | Yes |

**Example Request: Create Appliance (`POST /api/appliances`)**
```json
// Request Body
{
  "name": "Air Conditioner",
  "powerConsumption": 1500,
  "usageHours": 8,
  "category": "Cooling"
}
```
**Example Response (201 Created):**
```json
{
  "message": "Appliance added successfully",
  "data": { 
    "id": "64f...", 
    "name": "Air Conditioner", 
    "powerConsumption": 1500,
    "usageHours": 8,
    "category": "Cooling",
    "dailyEnergyConsumption": 12 
  }
}
```

### **3. Carbon Footprint Tracker**

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/carbon` | Log monthly consumption data | Yes |
| `GET` | `/api/carbon` | View carbon history & footprint| Yes |

**Example Request: Log Data (`POST /api/carbon`)**
```json
{
  "month": "April",
  "year": 2024,
  "electricityUsedKwh": 350
}
```
**Example Response (201 Created):**
```json
{
  "message": "Data logged successfully",
  "data": { "carbonFootprintKg": 145.2 }
}
```

### **4. Energy Audit Management**

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/audits` | Create an energy audit | Yes |
| `GET` | `/api/audits` | Retrieve user audit history | Yes |
| `POST` | `/api/audits/chat` | AI-driven conversational insights| Yes |
| `POST` | `/api/audits/simulate`| Habit change impact projection | Yes |

**Example Request: Run Simulation (`POST /api/audits/simulate`)**
```json
{
  "proposedChanges": [
    { "applianceId": "64f...", "newUsageHours": 4 }
  ]
}
```
**Example Response (200 OK):**
```json
{
  "message": "Simulation complete",
  "projectedSavingsKwh": 48.5,
  "financialSavings": 12.50
}
```

### **5. Solar Potential Estimator**

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/solar/estimate`| Solar capacity & ROI calculation | No |

**Example Request: Estimate Solar (`POST /api/solar/estimate`)**
```json
{
  "roofSizeSqMeters": 50,
  "location": "Colombo"
}
```
**Example Response (200 OK):**
```json
{
  "estimatedCapacityKw": 7.5,
  "projectedAnnualSavingsKwh": 10500,
  "estimatedROIYears": 4.2
}
```

### **6. Electricity Cost & Goals**

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/costs` | Log monthly electricity cost | Yes |
| `POST` | `/api/costs/estimate`| Tariff-based bill estimation | Yes |
| `POST` | `/api/costs/goals` | Set monthly/yearly saving goals | Yes |
| `GET` | `/api/costs/ai-insights`| AI-driven spending patterns | Yes |

**Example Request: Set Goal (`POST /api/costs/goals`)**
```json
{
  "targetMonthlyCost": 2500,
  "targetCurrency": "LKR"
}
```
**Example Response (201 Created):**
```json
{
  "message": "Goal configured successfully",
  "data": { "targetMonthlyCost": 2500 }
}
```

---

## 🧪 Testing Instruction Report

The Flux Energy Audit system maintains an "Excellent" reliability standard through rigorous automated testing, targeting high coverage for unit, integration, and performance layers.

### **i. Testing Environment Configuration Details**
- **Test Frameworks**: `Jest` and `Supertest` (Backend API), `React Testing Library` (Frontend Components).
- **In-Memory/Isolated Databases**: Backend tests utilize a mock MongoDB setup or isolated database instances via `npm test` configuration to prevent data contamination.
- **Load Testing**: Uses `Artillery.io` for robust endpoint stress simulation.

### **ii. How to Run Unit Tests**
Unit tests isolate business logic, services, and controllers without external dependencies.
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Execute the unit test suite:
   ```bash
   npm test
   ```
   *(To test a specific module, e.g., appliance controller: `npx jest tests/appliancemanagement.controller.test.js`)*
3. **Verify Code Coverage**:
   ```bash
   npm run test:coverage
   ```
   This generates an HTML report in `backend/coverage/` verifying the percentage of code executed by tests.

### **iii. Integration Testing Setup and Execution**
Integration testing ensures different modules (Router → Controller → Services → Database) function correctly together.
1. Ensure your `.env` contains valid configurations (often Jest overrides this with a test DB URI).
2. Execute integration-specific tests using:
   ```bash
   npx jest *.integration.test.js
   ```
   *(e.g., testing full appliance life cycle via `appliancemanagement.integration.test.js`)*

### **iv. Performance Testing Setup and Execution**
We use Artillery to validate system performance under load.
1. Ensure the backend server is running in a separate terminal:
   ```bash
   cd backend
   npm start
   ```
2. Run the predefined Artillery scenarios:
   ```bash
   cd backend
   npm run test:performance
   ```
3. Load test definitions can be modified in `backend/tests/performance/appliance-load.yml` to alter virtual user (VUs) injection rates and concurrent requests.

---

## 🚀 Deployment Report

### **Deployment Architecture Overview**
The application adheres to cloud-native best practices to ensure continuous availability, scalability, and fast read operations.

| Architecture Component | Recommended Provider | Current Status |
| :--- | :--- | :--- |
| **Frontend UI (React)** | Vercel / Netlify | **Ready for Production** |
| **Backend REST API (Node)** | Render / Railway / Heroku | **Ready for Production** |
| **NoSQL Database** | MongoDB Atlas Cloud | **Live / Configured** |

### **CI/CD & Configuration Details**
1. **Frontend**: Distributed globally via CDN. Build commands are optimized.
   - *Environment Variable*: `REACT_APP_API_URL` securely points to the live backend server.
   - *Build Command*: `npm run build` generates minimized static files.
2. **Backend**: Scalable container-based instance.
   - *CORS*: Configuration explicitly locked to trusted frontend domains to prevent CSRF and cross-origin abuse.
   - *Secrets Management*: Environment keys like `JWT_SECRET` and `GEMINI_API_KEY` are safely injected via the deployment provider's dashboard, not checked into source control.
3. **Delivery Pipeline**: Commits to the main Git branch can trigger webhook-based auto-deployments on Render/Vercel to propagate bug fixes implicitly.

---
