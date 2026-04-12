<div align="center">
  <h1>⚡ Flux Energy Audit - Backend ⚡</h1>
  <p><em>Empowering energy literacy and sustainable consumption through smart algorithms.</em></p>
  
  ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
  ![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
  ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
  ![Gemini AI](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)
</div>

---

## 🌟 Overview 

Welcome to the **Flux Energy Audit** backend engine! This robust API serves as the brain behind a comprehensive toolkit designed to help users understand, analyze, and optimize their energy consumption. By leveraging the power of **Google's Generative AI** and intelligent data processing, Flux turns confusing energy metrics into actionable, sustainable insights.

## ✨ Key Features

- 🧠 **AI-Powered Insights**: Integrates with Google Generative AI to provide smart, contextual energy recommendations.
- 🔒 **Secure by Design**: Rock-solid authentication using JWT and bcrypt for safe user data management.
- 📊 **Dynamic Cost Estimation**: Flexible tariff calculation supporting both local slab tables and third-party APIs.
- 📖 **Interactive Documentation**: Beautifully auto-generated API docs via Swagger UI.
- ⚡ **Blazing Fast**: Built on the performant Express.js & MongoDB stack.

## 🛠️ Technology Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Core** | Node.js, Express | Fast, unopinionated, minimalist web framework. |
| **Database** | MongoDB, Mongoose | Elegant NoSQL object modeling. |
| **Security** | JWT, bcryptjs, cors | Token-based auth, secure hashing, and cross-origin resource sharing. |
| **AI Engine** | `@google/generative-ai` | Next-gen smart processing & recommendations. |
| **Validation** | Joi | Powerful schema description and data validator. |
| **Documentation**| Swagger UI/JSDoc | Interactive API exploration. |

## 🚀 Launch Sequence (Getting Started)

Ready to power up? Follow these steps to get your local server running.

### 1️⃣ Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18+ recommended)
- A running [MongoDB](https://www.mongodb.com/) instance (local or Atlas)

### 2️⃣ Installation
Clone the repository, blast into the `backend` directory, and install the modules:
```bash
npm install
```

### 3️⃣ Environment Variable Matrix
Create a `.env` file in your root backend directory to store your secrets safely. Here's your launch template:

```env
# Server Configuration
PORT=5000

# Database
MONGODB_URI=your_mongodb_connection_string

# Security
JWT_SECRET=your_super_secret_jwt_key

# External APIs
GEMINI_API_KEY=your_google_gemini_api_key
```

### 4️⃣ Ignition (Running the App)

**🛠️ Development Mode** (Hot-reloading via nodemon)
```bash
npm run dev
```

**🚀 Production Mode**
```bash
npm start
```

## 🧪 Testing Instruction Report

The Flux Energy Audit system maintains an "Excellent" reliability standard through rigorous automated testing, targeting high coverage for unit, integration, and performance layers.

### 🧪 i. How to Run Unit Tests

Unit tests isolate business logic, services, and controllers without external dependencies to ensure core logic correctness.

#### Run All Tests
```bash
npm test
```

#### Run Specific Feature Tests
To run unit and integration tests for a specific feature, use the following commands:

| Feature | Command |
| :--- | :--- |
| **All Features** | `npm test` |
| **User Management** | `npm test -- tests/userManagement` |
| **Appliance Management** | `npm test -- tests/appliancemanagement` |
| **Carbon Footprint** | `npm test -- tests/carbonFootprintTracker` |
| **Energy Audit** | `npm test -- tests/energyAuditManagement` |
| **Cost Management** | `npm test -- tests/costManagement` |
| **Solar Estimator** | `npm test -- tests/solarEstimator` |

#### Run Tests with Coverage
Verify which parts of your code are tested:
```bash
npm run test:coverage
```
This generates an HTML report in `backend/coverage/index.html`.

---

### 🔗 ii. Integration Testing Execution
Integration testing ensures different modules (Router → Controller → Services → Database) function correctly together.
- **Execution**: Run all integration-specific tests:
  ```bash
  npm test -- .integration.test.js
  ```

---

### ⚡ iii. Performance Testing Execution
We use **Artillery.io** to validate system stability under concurrent user load.

1. **Start the backend server**:
   ```bash
   npm start
   ```

2. **Run performance scenarios** (in a new terminal):
   ```bash
   npm run test:performance
   ```

---

### ⚙️ iv. Testing Environment Details
- **Frameworks**: `Jest` and `Supertest`.
- **Environment**: Backend tests run in a `test` NODE_ENV.
- **Cleanup**: The `tests/setup.js` ensures a clean database state before every test.


## 🔋 Advanced: Cost Estimation with Tariff Sources

The `POST /api/costs/estimate` endpoint is engineered to handle dynamic pricing models. It gracefully supports multiple tariff sources:

- 🌍 **`external`**: Fetches live data from a third-party tariff API.
- 🏠 **`local`**: Falls back to the built-in, reliable local slab table.
- 🛡️ **`local_fallback`**: Automatically kicks in if the third-party API is unreachable.

#### Optional Environment variables for dynamic tariffs:
If you want to live on the edge and use a third-party API, add these to your `.env`:
```env
USE_TARIFF_API=true
TARIFF_API_URL=https://your-provider.example.com
TARIFF_API_KEY=your_api_key # (Optional, depending on provider)
```

---
<div align="center">
  <i>Built with 💚 for a sustainable future.</i>
</div>
