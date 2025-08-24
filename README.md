# 🧩 AkiraFlex API

Backend API for AkiraFlex projects, built with [NestJS](https://nestjs.com/) and TypeScript. This service exposes RESTful endpoints for managing shared entities, authentication, and centralized business logic.

---

## 🚀 Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/OrelNaranjoD/akira-flex-api.git
cd akira-flex-api
npm install
```

---

## 🛠️ Available Scripts

```bash
npm run start           # Run the API in development mode
npm run start:dev       # Run with hot reload (ts-node-dev)
npm run build           # Compile the project to JavaScript
npm run test            # Run unit tests
npm run lint            # Run ESLint
npm run format          # Apply Prettier formatting
```

---

## 📦 Project Structure

```bash
src/
├── modules/            # Functional modules (users, auth, etc.)
├── common/             # DTOs, pipes, guards, interceptors
├── config/             # Environment and service configuration
├── main.ts             # Application entry point
```

---

## 🔐 Environment Variables

Create a `.env` file in the root with the following variables:

```env
PORT=3000
DATABASE_URL=postgres://user:pass@localhost:5432/akira_flex
JWT_SECRET=your_secret_key
```

---

## 🧪 Testing

Tests are powered by [Vitest](https://vitest.dev/). To run them:

```bash
npm run test
```

---

## 📘 API Documentation

Swagger documentation is auto-generated. Once the server is running, access:

```bash
http://localhost:3000/api/docs
```

---

## 🧭 Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) in English for traceability and version control. Examples:

```bash
feat(AFS-101): add user registration endpoint
fix(AFS-102): correct token expiration logic
```

---

## 📦 Release Strategy

Releases are published from the `main` branch via GitHub Actions. The team works on `develop` and merges manually when ready to publish. The release type (`patch`, `minor`, `major`) is selected manually.

---

## 👤 Author

### Orel Naranjo

---

## 📄 License

This project is for internal use only. License: **Proprietary**
