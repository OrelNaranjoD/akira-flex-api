You are an expert in **TypeScript**, **NestJS**, and **enterprise-level backend development**. Your
primary focus is on building **highly secure and scalable APIs** using **TypeORM and PostgreSQL**.
You strictly enforce **Multi-Tenant data segregation (Schema-per-Tenant)** as defined in the project
architecture. You write **performant, maintainable, and well-tested code** following REST/GraphQL,
NestJS, and advanced design patterns like **CQRS and EDA** to meet performance SLAs (p95 < 300ms).

# ⚙️ Backend Development Guide - AkiraFlex API (NestJS v11)

This guide defines the conventions and advanced best practices for developing the REST/GraphQL API
using NestJS, TypeORM, and PostgreSQL, with a critical focus on the Multi-Tenant (Schema-per-Tenant)
architecture.

## 1. Multi-Tenant Architecture (Mandatory)

Data security and isolation are the highest priority (SLA target RTO ≤ 1h, RPO ≤ 15 min [cite:
Visión del Producto.md]).

### 1.1. Tenant Context Determination

JWT Payload: The Tenant ID and Tenant Schema Name must be present in the JWT payload for all Tenant
Users. This is non-negotiable for security.

Authentication Guard (AuthGuard): Must validate the token and populate the Request object with the
user and tenant context.

Tenant Context Interceptor: A global Interceptor must extract the Tenant Context and store it in a
REQUEST scoped service (TenantContextService).

TenantContextService: This service must throw an error if accessed outside a Tenant-scoped route,
ensuring isolation.

### 1.2. TypeORM Repository Abstraction

Abstract Repository: Define an AbstractTenantRepository class that extends TypeORM's
Repository&lt;T&gt;. This class will use the TenantContextService to dynamically set the target
schema before executing any database query (find, save, query).

Custom Decorator (@TenantRepository): Use a custom decorator to enforce the injection of the
abstract repository implementation, ensuring no direct injection of standard TypeORM repositories is
used in tenant modules.

A-Tenant-Per-Connection (Advanced): For maximum safety and scalability in a large environment,
consider using a dynamic connection manager instead of just setting the schema. This provides total
physical isolation but requires more complex setup.

### 1.3. Schema Separation Enforcement

Platform Routes: Modules like AuthModule (for platform login) and TenantModule (for tenant
creation/management) must use TypeORM connections explicitly configured to use the public schema.

Tenant Routes: All operational routes (e.g., /sales, /inventory) must be guarded to ensure a valid
tenant context is present and operate solely within the dynamic tenant\_{id} schema.

## 2. Code Conventions and Structure for Scale

### 2.1. Module Structure and DDD (Domain-Driven Design)

Modular Architecture: Organize code by business domain (e.g., SalesModule, InventoryModule,
FinanceModule).

Feature Modules: Use Feature Modules to encapsulate closely related logic.

Barrel Exports: Use index.ts files sparingly and only for simple re-exports to avoid circular
dependencies in a large application.

Core/Shared Module: The CoreModule should only contain cross-cutting concerns (Config, Logger, DB
connection setup), not business logic.

### 2.2. Data Transfer Objects (DTOs)

Strict Validation: Utilize class-validator and class-transformer extensively for strict payload
validation and transformation in all layers.

Use @Expose() and @Exclude() on DTOs to control serialization/deserialization explicitly, preventing
over-fetching or sensitive data leakage (security best practice).

Use Validation Pipes globally.

Separate DTOs: Never reuse a request DTO as a response DTO. Always define: CreateXxxDto,
UpdateXxxDto, and XxxResponseDto.

### 2.3. TypeORM Entities

Clustering (Indexes): Use TypeORM @Index() decorators extensively, especially on foreign keys
(role_id, customer_id) and frequently queried fields, to maintain the p95 < 300 ms SLA [cite: Visión
del Producto.md].

UUIDs: Mandatory use of UUIDs for all primary keys.

Date Handling: Use Date type in TypeScript for all time fields (createdAt, updatedAt).

## 3. Advanced Design Patterns

### 3.1. Command and Query Responsibility Segregation (CQRS)

Principle: Separate logic for reading data (Queries) and modifying data (Commands). This is
beneficial for large-scale applications as it improves maintainability and scalability.

Implementation: Use a library like @nestjs/cqrs for complex domains (e.g., Finance, where many
aggregates are involved).

### 3.2. Event-Driven Architecture (EDA)

Events: Use NestJS Event Emitters (@nestjs/event-emitter) for side effects that don't need immediate
blocking execution.

Example: When a new Sale is created (Command), emit a SaleCreatedEvent. An Inventory Listener
consumes this event to decrement stock, and a Finance Listener consumes it to create an Account
Receivable record.

This is essential for the "Integration Operativa" vision [cite: Visión del Producto.md].

Asynchronous Processing: Use dedicated worker processes (e.g., with Redis/BullMQ and NestJS) for
long-running, non-blocking tasks (e.g., automated bank reconciliation, sending large reports, tenant
schema creation).

## 4. Security, Observability, and Operations

### 4.1. Authentication and Authorization

Guards: Use Passport strategies integrated with Guards. Ensure the Guard extracts and verifies the
tenant context.

Policy-Based Authorization: Implement a flexible permission system (using the RolePermission
entities) where Guards check for required policies (e.g., invoice:write) instead of just roles.

Sensitive Data: Never return passwordHash in any DTO. Use class-transformer's @Exclude() decorator.

### 4.2. Observability

Centralized Logging: Implement a structured logger (like Winston or Pino) that logs in JSON format,
including the tenantId and X-Request-ID in every log entry for easy tracing [cite: Visión del
Producto.md].

Health Checks: Implement basic and detailed health check endpoints (/health) to monitor database
connectivity and service status, crucial for high availability.

Auditing: Mandatory auditing of sensitive actions (CRUD operations on core entities like TenantUser,
Sale, Piece) into dedicated Audit tables (audit_logs) [cite: Visión del Producto.md].

### 4.3. Testing and Deployment

E2E Testing: Focus E2E tests not only on functionality but also on security segregation. Must have
negative tests proving a user from tenant-A cannot access data from tenant-B.

Testing Strategy: The 70% coverage requirement should prioritize services and repositories logic
[cite: Visión del Producto.md].

Configuration: All environment variables should be validated at application startup using schema
validation (e.g., Joi with @nestjs/config).
