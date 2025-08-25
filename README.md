# 🧩 AkiraFlex API

Backend API for AkiraFlex projects, built with [NestJS](https://nestjs.com/) and TypeScript. This service exposes RESTful endpoints for managing shared entities, authentication, and centralized business logic.

---

## Requirements

- Node.js (v22)
- PostgreSQL (v17)

## 🚀 Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/OrelNaranjoD/akira-flex-api.git
cd akira-flex-api
$env:FLEX_LIB_TOKEN="your_token_here"
npm install
```

Note: You need to have your GitHub token set as an environment variable for the installation to work.
Go to [GitHub](https://github.com) and create a personal access token with the necessary permissions.

Steps:

1. Click on your profile picture in the top right corner and select "Settings".
2. In the left sidebar, click on "Developer settings".
3. Click on "Personal access tokens" and then "Tokens (classic)".
4. Click "Generate new token", give it a descriptive name, and select the scopes you need.
5. Select the scopes related to "repo" and "write:packages".
6. Click "Generate token" and copy the token.
7. Set the token using `$env:GITHUB_FLEX_TOKEN="your_token_here"`.

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
├── modules/
│   ├── auth/             # Authentication and access control
│   ├── users/            # User management
│   ├── roles/            # Role definitions and permissions
│   ├── organizations/    # Company and team structures
│   ├── projects/         # Project lifecycle and metadata
│   ├── workflows/        # Workflow definitions and execution
│   ├── tasks/            # Task tracking and assignment
│   ├── comments/         # Threaded discussions and notes
│   ├── notifications/    # In-app and external alerts
│   ├── files/            # File uploads and metadata
│   ├── settings/         # User and system preferences
│   ├── calendar/         # Calendar and scheduling
│   ├── audit/            # Change tracking and history
│   ├── files/            # File uploads and metadata
│   ├── tenants/          # Multi-tenancy support
│   ├── platform/         # Platform-specific logic
│   └── reports/          # Aggregated data and analytics
├── core/                 # Core application logic
│   ├── filters/          # Custom exception filters
│   ├── guards/           # Route guards
│   ├── interceptors/     # Request/response interceptors
│   └── pipes/            # Validation and transformation pipes
├── config/               # Environment and service configuration
├── definitions/          # Shared types and interfaces
├── main.ts               # Application entry point
```

---

## 🔐 Environment Variables

Create a `.env` file in the root with the following variables:

```env
# App
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=multitenant

# TypeORM
DATABASE_URL=postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}
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
