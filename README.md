# 🧩 AkiraFlex API

Backend API for AkiraFlex projects, built with [NestJS](https://nestjs.com/) and TypeScript. This
service exposes RESTful endpoints for managing shared entities, authentication, and centralized
business logic.

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

Note: You need to have your GitHub token set as an environment variable for the installation to
work. Go to [GitHub](https://github.com) and create a personal access token with the necessary
permissions.

Steps:

1. Click on your profile picture in the top right corner and select "Settings".
2. In the left sidebar, click on "Developer settings".
3. Click on "Personal access tokens" and then "Tokens (classic)".
4. Click "Generate new token", give it a descriptive name, and select the scopes you need.
5. Select the scopes related to "repo" and "write:packages".
6. Click "Generate token" and copy the token.
7. Set the token using `$env:FLEX_LIB_TOKEN="your_token_here"`.

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
akira-flex-api/
├── src/
│   ├── core/                 # Application bootstrap and infrastructure
│   │   ├── database/         # ORM configuration, migrations, factories
│   │   ├── error/            # Centralized error handling
│   │   ├── audit/            # Audit logging
│   │   ├── definitions/      # Temp Shared definitions for AkiraFlex lib
│   │   ├── bootstrap.ts      # App initialization logic
│   │   ├── app.module.ts     # Root module composition
│   │   └── main.ts           # Application entry point
│   ├── modules/              # Domain-specific business logic
│   │   ├── platform/         # Platform-side modules (admin context)
│   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── roles/
│   │   │   │   └── permissions/
│   │   │   ├── organizations/
│   │   │   ├── settings/
│   │   │   ├── tenants/
│   │   │   ├── reports/
│   │   │   └── status/
│   │   ├── tenant/           # Tenant-side modules (client context)
│   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── roles/
│   │   │   │   └── permissions/
│   │   │   ├── organizations/
│   │   │   ├── projects/
│   │   │   ├── workflows/
│   │   │   ├── tasks/
│   │   │   ├── comments/
│   │   │   ├── notifications/
│   │   │   ├── files/
│   │   │   ├── settings/
│   │   │   ├── calendar/
│   │   │   ├── reports/
│   │   │   └── status/
├── test/                     # Unit and integration tests
│   ├── e2e/                  # End-to-end tests
│   └── unit/                 # Unit tests
│       └── platform/         # Unit tests for platform module
│       └── tenant/           # Unit tests for tenant module
│       └── core/             # Unit tests for core module
├── README.md                 # Project documentation
```

---

## 🔐 Environment Variables

You must create the following files in the project root:

- `.env`: for development
- `.env.test`: for testing
- `.env.example` and `.env.test.example`: examples to share configuration without real credentials

Example `.env`:

```env
# App
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=your_password
DB_NAME=akira_develop

# TypeORM
DATABASE_URL=postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}
```

Example `.env.test`:

```env
# App
PORT=3000
NODE_ENV=test

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=akira_test

# TypeORM
DATABASE_URL=postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}
```

You can copy `.env.example` and `.env.test.example` to create your own environment files.

---

## 🧪 Testing

Unit and e2e tests use [Jest](https://jestjs.io/). To run them:

```bash
npm run test
```

By default, Jest will load `.env.test` for tests. Make sure your test database is configured and
accessible.

---

## 📘 API Documentation

Swagger documentation is auto-generated. Once the server is running, access:

```bash
http://localhost:3000/api/docs
```

---

## 🧭 Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) in English for
traceability and version control. Examples:

```bash
feat(AFS-101): add user registration endpoint
fix(AFS-102): correct token expiration logic
```

---

## 📦 Release Strategy

Releases are published from the `main` branch via GitHub Actions. The team works on `develop` and
merges manually when ready to publish. The release type (`patch`, `minor`, `major`) is selected
manually.

---

## 👤 Author

### Orel Naranjo

---

## 📄 License

This project is for internal use only. License: **Proprietary**
