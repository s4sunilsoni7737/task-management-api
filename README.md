# Full Stack Developer (Fresher) – Technical Assessment: Backend (NestJS + MongoDB)

This repository contains the backend implementation of the Task Management System for the Full-Stack Developer technical assessment.

## Overview
This project demonstrates robust backend engineering skills, clean architecture, and strict attention to detail in building a scalable API service that powers the Pyramid Task Management frontend.

## Tech Stack
- **Framework**: NestJS
- **Language**: TypeScript (strict mode)
- **Database**: MongoDB
- **ORM / ODM**: Mongoose
- **Validation**: class-validator & class-transformer

---

## Assessment Requirements Fulfillment

### 1. Clean NestJS APIs & Architecture
- **Modular Structure**: The application follows a domain-driven, modular NestJS architecture (`AuthModule`, `TasksModule`, `ProjectsModule`, `CommentsModule`, etc.).
- **Controllers & Services**: Clear separation of concerns between Controllers (HTTP routing and payload parsing) and Services (business logic and database operations).
- **RESTful Design**: The API exposes a clean, predictable RESTful surface (`GET`, `POST`, `PATCH`, `DELETE`) with standardized `{ data: T }` response envelopes.
- **Global Exception Handling**: Implemented custom exception filters to return predictable, typed error structures across all endpoints.

### 2. Validation & Security
- **DTO Validation**: Every incoming request payload is strictly validated using Data Transfer Objects (DTOs) heavily decorated with `class-validator` (e.g., ensuring correct enum values, required strings, valid dates).
- **Type Safety**: TypeScript is leveraged extensively across both Mongoose schemas and controller outputs.

### 3. Guest Login
- **Authentication**: Implemented a guest authentication system (`/auth/guest`) that securely manages temporary guest sessions.
- **Session Persistence**: Provides persistent user identification across the application for the guest role, ensuring all tasks and projects are properly scoped.

### 4. Good Project Structure & Reusable Components
- **Reusable Guards & Decorators**: Implemented reusable decorators for extracting user context and guards for protecting authenticated routes.
- **Mongoose Repositories**: Clean integration with MongoDB, keeping queries highly optimized and abstracted from business logic.
- **Environment Configuration**: Environment variables are managed securely (e.g., `.env`), supporting easy switching between development, testing, and production environments.

---

## Intentional Deviations & Notes
*Documenting any implementation notes regarding the assessment guidelines.*
- **Mock Frontend Integration**: The frontend repository currently uses a mock in-memory version of this exact API structure for zero-dependency local execution. However, this backend repository is the fully realized, production-ready implementation of that same API contract.
- **OAuth Providers**: While the architecture supports OAuth (e.g., Google login), the assessment focus was primarily on guest sessions, so external OAuth providers are scaffolded but left as stubs.

## Live Project URLs
- **Frontend App**: [https://task-management-webportal.vercel.app](https://task-management-webportal.vercel.app)
- **Backend API Docs**: [https://task-management-api-gold.vercel.app/api/docs](https://task-management-api-gold.vercel.app/api/docs)

---

## Configuration & Security Philosophy

*Why `constants.ts` over `.env`?*

In this project, configuration and fallback secrets are managed via static TypeScript constants in `src/constants.ts` for production environments. For local development, we still use `.env` files for developer convenience (see `.env.example` for required keys).

This transition to `constants.ts` for live deployments is an intentional security and architecture decision:
- **Leakage Risk**: `.env` files are notoriously susceptible to accidental version-control commits or public exposure via misconfigured web servers. They are frequently targeted by automated vulnerability scanners.
- **CI/CD Integration**: In live production and CI/CD pipelines, we use YAML scripts to securely provide the path of the constants file and inject credentials dynamically at build time, keeping secrets completely out of the runtime environment space.

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Running locally or via MongoDB Atlas)

### Installation
```bash
npm install
```

### Configuration
Create a `.env` file in the root directory and add your MongoDB connection string:
```env
MONGODB_URI=mongodb://localhost:27017/task-management
PORT=3001
```

### Running the Application
```bash
npm run start:dev   # Watch mode for development
npm run build       # Production build
npm run start:prod  # Run production build
```

API running on http://localhost:8000/api/v1  
Swagger docs available at http://localhost:8000/api/docs