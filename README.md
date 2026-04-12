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
| `GET` | `/api/users/me` | Get logged-in user's profile | Yes |
| `PUT` | `/api/users/me` | Update user profile data | Yes |
| `DELETE`| `/api/users/me` | Delete user account | Yes |

**Example Request: User Login (`POST /api/users/login`)**
```json
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
  "user": { "id": "64f1a2...", "name": "Jane Doe", "email": "user@example.com" }
}
```

### **2. Appliance Management**

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/appliances` | Register a new appliance | Yes |
| `GET` | `/api/appliances` | List all appliances for user | Yes |
| `GET` | `/api/appliances/audit`| Get weather-aware energy audit | Yes |
| `GET` | `/api/appliances/stats`| Get overall device statistics | Yes |
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
| `POST` | `/api/carbon` | Create a new footprint record | Yes |
| `GET` | `/api/carbon` | List all historical records | Yes |
| `GET` | `/api/carbon/:id` | Get details of a record | Yes |
| `PUT` | `/api/carbon/:id` | Update an existing record | Yes |
| `DELETE`| `/api/carbon/:id` | Delete a footprint record | Yes |

**Example Request: Add Record (`POST /api/carbon`)**
```json
{
  "month": "March",
  "year": 2026,
  "electricity": 150,
  "gasData": { "selections": ["LPG"], "amounts": { "LPG": 12.5 } }
}
```
**Example Response (201 Created):**
```json
{
  "message": "Record created successfully",
  "data": { "co2Emission": 185.4, "status": "Moderate", "month": "March", "year": 2026 }
}
```

### **4. Energy Audit Management**

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/energy-audits` | Create audit & get AI insights | Yes |
| `GET` | `/api/energy-audits` | List all previous audits | Yes |
| `GET` | `/api/energy-audits/:id`| Get specific audit details | Yes |
| `PUT` | `/api/energy-audits/:id`| Update and re-analyze audit | Yes |
| `DELETE`| `/api/energy-audits/:id`| Remove audit record | Yes |
| `POST` | `/api/energy-audits/:id/simulate` | Predict behavior change impact| Yes |
| `POST` | `/api/energy-audits/:id/chat` | AI Chat based on audit context| Yes |

**Example Request: Chat with AI (`POST /api/energy-audits/64f.../chat`)**
```json
{
  "message": "How can I reduce my AC consumption specifically?",
  "history": []
}
```
**Example Response (200 OK):**
```json
{
  "response": "Based on your audit, your AC runs 8 hours at 1500W. Try setting the temperature to 24°C..."
}
```

### **5. Solar Potential Estimator**

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/solar/estimate`| Calculate Solar ROI & Capacity | No |

**Example Request: Solar ROI (`POST /api/solar/estimate`)**
```json
{
  "roofSizeSqMeters": 40,
  "location": "Kandy"
}
```
**Example Response (200 OK):**
```json
{
  "estimatedCapacityKw": 6.0,
  "projectedAnnualSavingsKwh": 10500,
  "estimatedROIYears": 3.5
}
```

### **6. Electricity Cost & Goals**

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/costs` | Log monthly cost (w/ bill upload)| Yes |
| `GET` | `/api/costs` | List user cost history | Yes |
| `POST` | `/api/costs/estimate`| Tariff-based bill calculation | Yes |
| `GET` | `/api/costs/ai-insights`| Get AI spending patterns | Yes |
| `GET` | `/api/costs/:id` | Get specific cost entry | Yes |
| `PUT` | `/api/costs/:id` | Update a cost entry | Yes |
| `DELETE`| `/api/costs/:id` | Delete a cost entry | Yes |
| `POST` | `/api/costs/goals` | Set a new saving goal | Yes |
| `GET` | `/api/costs/goals` | List all saving goals | Yes |
| `GET` | `/api/costs/goals/:id`| Get details of a goal | Yes |
| `PUT` | `/api/costs/goals/:id`| Update a saving goal | Yes |
| `DELETE`| `/api/costs/goals/:id`| Remove a saving goal | Yes |

**Example Request: Bill Estimation (`POST /api/costs/estimate`)**
```json
{
  "units": 150,
  "month": 4,
  "provider": "CEB",
  "peakUnits": 30
}
```
**Example Response (200 OK):**
```json
{
  "estimatedBill": 6250.75,
  "summary": { "energyCharge": 5200, "fixedCharge": 400, "tax": 650.75 }
}
```

---

## 🧪 Testing Instruction Report

The Flux Energy Audit system maintains an "Excellent" reliability standard through rigorous automated testing, targeting high coverage for unit, integration, and performance layers.

### **i. How to Run Unit Tests**
Unit tests isolate business logic, services, and controllers without external dependencies to ensure core logic correctness.
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. **Run Specific Feature Tests**:
   To test a specific module, use the following commands:

   | Feature | Command |
   | :--- | :--- |
   | **All Features** | `npm test` |
   | **User Management** | `npm test -- tests/userManagement` |
   | **Appliance Management** | `npm test -- tests/appliancemanagement` |
   | **Carbon Footprint** | `npm test -- tests/carbonFootprintTracker` |
   | **Energy Audit** | `npm test -- tests/energyAuditManagement` |
   | **Cost Management** | `npm test -- tests/costManagement` |
   | **Solar Estimator** | `npm test -- tests/solarEstimator` |

3. **Verify Code Coverage**:
   ```bash
   npm run test:coverage
   ```
   This generates an HTML report in `backend/coverage/index.html` verifying the percentage of code executed by tests. High coverage is maintained across all core services.

### **ii. How to Run Frontend Tests**
Frontend tests use `React Testing Library` and `Jest` to validate UI components and flows.
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Execute the test runner:
   ```bash
   npm test
   ```
   *(For a single run in CI environments: `npm run test:ci`)*

### **iii. Integration Testing Setup and Execution**
Integration testing ensures different modules (Router → Controller → Services → Database) function correctly together.
1. **Execution**: Execute all integration-specific tests using:
   ```bash
   npm test -- .integration.test.js
   ```
   This validates the full request-response lifecycle, including middleware and database persistence for routes like `/api/appliances` and `/api/users`.

### **iv. Performance Testing Setup and Execution**
We use **Artillery.io** to validate system stability and responsiveness under concurrent user load.
1. **Preparation**: Start the backend server in a dedicated terminal:
   ```bash
   cd backend
   npm start
   ```
2. **Execution**: Run the predefined Artillery scenarios in a second terminal:
   ```bash
   cd backend
   npm run test:performance
   ```
3. **Configuration**: Load test definitions can be modified in `backend/tests/performance/` (e.g., `costs-load.yml`) to stress-test specific modules.

### **v. Testing Environment Configuration Details**
- **Frameworks**: `Jest` and `Supertest` for API testing; `React Testing Library` for frontend component validation.
- **Environment**: Backend tests run in a `test` environment. Cleanup is handled automatically in `tests/setup.js`.

---

## 🚀 Deployment Report

### **Deployment Architecture Overview**
The application adheres to cloud-native best practices to ensure continuous availability, scalability, and fast read operations.

| Architecture Component | Recommended Provider | Current Status |
| :--- | :--- | :--- |
| **Frontend UI (React)** | Vercel | **Live** |
| **Backend REST API (Node)** | Railway | **Live** |
| **NoSQL Database** | MongoDB Atlas Cloud | **Live** |

### **CI/CD & Configuration Details**
1. **Frontend**: Distributed globally via CDN. Build commands are optimized.
   - *Environment Variable*: `REACT_APP_API_URL` securely points to the live backend server.
   - *Build Command*: `npm run build` generates minimized static files.
2. **Backend**: Scalable container-based instance.
   - *CORS*: Configuration explicitly locked to trusted frontend domains to prevent CSRF and cross-origin abuse.
   - *Secrets Management*: Environment keys like `JWT_SECRET` and `GEMINI_API_KEY` are safely injected via the deployment provider's dashboard, not checked into source control.
3. **Delivery Pipeline**: Commits to the main Git branch can trigger webhook-based auto-deployments on Render/Vercel to propagate bug fixes implicitly.

---
