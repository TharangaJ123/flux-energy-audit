# Flux Energy Audit

A web-based home energy audit toolkit focused on energy literacy and sustainable consumption.

## Project Structure

- `frontend/` React client application
- `backend/` Express and MongoDB API

## Getting Started

### Backend

```bash
cd backend
npm install
npm start
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## Testing

### Backend Unit and Integration Tests

Run the backend Jest and Supertest suite:

```bash
cd backend
npm test
```

Run backend tests with coverage:

```bash
cd backend
npm run test:coverage
```

### Frontend Component Tests

Run the frontend React Testing Library suite once in CI mode:

```bash
cd frontend
npm run test:ci
```

### Performance Testing

Artillery is configured for a simple backend load test.

1. Start the backend server:

```bash
cd backend
npm start
```

2. In another terminal, run the load test:

```bash
cd backend
npm run test:performance
```

The Artillery scenario file is located at `backend/tests/performance/costs-load.yml`.
