# TaskFlow API

Backend for the **TaskFlow Task Management System** — built for the AbleSpace Full-Stack
Developer (Fresher) technical assessment, **Part 1**. NestJS + MongoDB (Mongoose), following
the architecture and coding conventions defined in the project's API Portal blueprint
(response envelopes, guard chaining, soft deletes, lean/paginated reads, etc.).

## Contents

- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Architecture](#architecture)
- [Modules & data model](#modules--data-model)
- [API overview](#api-overview)
- [Response envelope](#response-envelope)
- [Postman collection](#postman-collection)
- [Design decisions & deviations](#design-decisions--deviations)

## Tech stack

| Layer | Choice |
|---|---|
| Framework | NestJS 10 (TypeScript) |
| Database | MongoDB via Mongoose |
| Auth | JWT (guest sessions) + Google OAuth2 (passport-google-oauth20) |
| Validation | class-validator / class-transformer, global `ValidationPipe` |
| Docs | Swagger / OpenAPI at `/api/docs` |
| Security | Helmet, whitelist-based CORS, 15s global request timeout |

## Getting started

```bash
npm install
cp .env.example .env      # then edit MONGODB_URI / JWT_SECRET / etc.
npm run start:dev
```

The API boots at `http://localhost:8000/api/v1` and Swagger UI at
`http://localhost:8000/api/docs`.

Requires a running MongoDB instance — either local (`mongod`) or a free
[MongoDB Atlas](https://www.mongodb.com/atlas) cluster; point `MONGODB_URI` at either.

### Seed demo data (optional)

```bash
npm run seed
```

Creates a demo user, a "Dexter" workspace, one project, five labels, and five tasks spread
across every status column — handy for exercising the List/Board views immediately.

### Build & run in production mode

```bash
npm run build
npm run start:prod
```

## Environment variables

See [`.env.example`](./.env.example) for the full list. Only `MONGODB_URI` and `JWT_SECRET`
are required to run the app; `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are optional and only
needed to enable "Login with Google".

## Architecture

```
HTTP Request
     │
     ▼
[Helmet + CORS]
     │
     ▼
[ValidationPipe]        ← whitelist + transform every request body/query
     │
     ▼
[TimeoutInterceptor]    ← kills any request hanging > 15s (408)
     │
     ▼
[JwtAuthGuard]           ← verifies JWT, populates req.user (userId, isGuest, email)
     │
     ▼
[Controller]             ← validates ObjectId params, delegates to Service, wraps response
     │
     ▼
[Service]                ← try/catch, business logic, Promise.all, .lean(), .select()
     │
     ▼
[Mongoose / MongoDB]
     │
     ▼
[HttpExceptionFilter]    ← normalizes every error response to the same envelope shape
     │
     ▼
[Response Envelope]      ← { success, userMessage, developerMessage, data }
```

### Folder structure

```
src/
  main.ts                    Bootstrap: Swagger, versioning, pipes, interceptors, CORS
  app.module.ts               Root module wiring every feature module + Mongoose connection
  config/
    configuration.ts          Typed env-driven configuration factory
  common/
    enums/                    TaskStatus, TaskPriority, Theme, ColorMode, ActivityType
    guards/                   JwtAuthGuard, GoogleAuthGuard
    decorators/                CurrentUser, Public
    interceptors/             TimeoutInterceptor (global 15s request timeout)
    filters/                   HttpExceptionFilter (normalized error envelope)
    interfaces/                 JwtPayload, AuthenticatedUser, ApiResponse, PaginatedResult
    utils/                      escapeRegex, buildPagination/toPaginatedResult ("smart" pagination)
  modules/
    auth/                      Guest login, Google OAuth, JWT issuance
    users/                     Profile + theme/colorMode preferences
    workspaces/                Workspace CRUD + membership
    projects/                  Project CRUD, scoped to a workspace
    tasks/                     Task CRUD, subtasks, resources, watchers — the largest module
    labels/                    Workspace-level label taxonomy
    comments/                  Comment CRUD on tasks (service only; routes live under /tasks)
    activity/                  Append-only activity log (service only; routes live under /tasks)
    health/                    GET /health liveness/readiness check
  database/
    seed.ts                    Optional demo-data seed script (npm run seed)
```

Every feature module follows the same internal layout:
`{controllers,services,dto,entities}` — controllers handle HTTP concerns and ObjectId
validation only; all business logic, error wrapping, and DB access lives in services.

## Modules & data model

| Entity | Key fields |
|---|---|
| **User** | name, email (nullable — guests), avatarUrl, googleId, isGuest, theme, colorMode, defaultWorkspaceId |
| **Workspace** | name, avatarUrl, ownerId, memberIds[] |
| **Project** | workspaceId, name, description, priority, leadId, dueDate |
| **Task** | workspaceId, projectId?, parentTaskId? (subtasks), title, description, status, priority, memberIds[], labelIds[], reporterId, teamId, startDate, endDate, dueDate, resources[], isPrivate, watcherIds[] |
| **Comment** | taskId, authorId, body, attachments[] |
| **ActivityLog** | taskId, actorId, type, fromValue, toValue, message *(append-only)* |
| **Label** | workspaceId, name, color |

All entities except `ActivityLog` are **soft-deleted** (`isDeleted` + `deletedAt`) — nothing is
ever hard-deleted, and every list query filters `isDeleted: false`.

## API overview

All routes are prefixed `/api/v1`. Full interactive docs (with request/response schemas,
example payloads, and a "Try it out" console) are at `/api/docs`. A Postman collection is also
included — see below.

| Method | Route | Notes |
|---|---|---|
| `POST` | `/auth/guest` | "Continue as Guest" — no body required |
| `GET` | `/auth/google` | Redirects to Google's consent screen |
| `GET` | `/auth/google/callback` | Google redirects here; issues a JWT, redirects to `FRONTEND_URL/auth/callback?token=...` |
| `GET` | `/users/me` | 🔒 Current user profile |
| `PATCH` | `/users/me/profile` | 🔒 Update name/avatar |
| `PATCH` | `/users/me/preferences` | 🔒 Update `{ theme, colorMode }` — persists across refresh |
| `GET` `/POST` | `/workspaces` | 🔒 List workspaces you belong to / create one |
| `GET` `/PATCH` `/DELETE` | `/workspaces/:id` | 🔒 Detail, update (owner only), soft-delete (owner only) |
| `POST` | `/workspaces/:id/members` | 🔒 Add a member |
| `GET` `/POST` | `/projects?workspaceId=` | 🔒 List (search + optional pagination) / create |
| `GET` `/PATCH` `/DELETE` | `/projects/:id` | 🔒 |
| `GET` `/POST` | `/labels?workspaceId=` | 🔒 Workspace label taxonomy |
| `PATCH` `/DELETE` | `/labels/:id` | 🔒 |
| `GET` `/POST` | `/tasks?workspaceId=&projectId=&status=&priority=&memberId=&labelId=&q=&groupByStatus=` | 🔒 Filtered/searchable list; `groupByStatus=true` returns tasks bucketed by Status for the List/Board views |
| `GET` `/PATCH` `/DELETE` | `/tasks/:id` | 🔒 |
| `POST` | `/tasks/:id/resources` | 🔒 Attach a document/link |
| `POST` `/DELETE` | `/tasks/:id/watch` | 🔒 Toggle watcher |
| `GET` `/POST` | `/tasks/:id/subtasks` | 🔒 |
| `GET` `/POST` | `/tasks/:id/comments` | 🔒 |
| `PATCH` `/DELETE` | `/tasks/:id/comments/:commentId` | 🔒 Author-only |
| `GET` | `/tasks/:id/activity` | 🔒 Updates/activity log |
| `GET` | `/health` | Liveness/readiness check (no auth) |

🔒 = requires `Authorization: Bearer <token>` (obtained from `/auth/guest` or the Google flow).

### Filtering & pagination conventions

- **Pagination is "smart"**: pass both `page` and `limit` to paginate; omit either and the full
  filtered set is returned (see `common/utils/pagination.util.ts`).
- **Search** (`q` on tasks, `search` on projects) is case-insensitive substring matching with
  regex-special-character escaping.
- **Status grouping**: `GET /tasks?...&groupByStatus=true` ignores pagination and returns
  `{ grouped: { todo: [...], doing: [...], ... }, total }` — a direct match for the List view's
  collapsible Status sections and the Board view's Kanban columns.

## Response envelope

Every endpoint returns the same shape:

```json
{
  "success": true,
  "userMessage": "Task fetched successfully",
  "developerMessage": "Task detail fetched",
  "data": { }
}
```

Errors are thrown as standard NestJS HTTP exceptions (400/401/403/404/409/408/500) and
normalized to the same shape (with `success: false`) by the global exception filter — never
returned as `success: false` inside a 200 response.

## Postman collection

Import [`TaskFlow.postman_collection.json`](./TaskFlow.postman_collection.json). It's organized
by module, includes example bodies for every write endpoint, and a `{{baseUrl}}` /
`{{accessToken}}` collection-variable pair — running **Auth → Continue as Guest** auto-populates
`accessToken` via a test script so every subsequent request is authenticated automatically.

## Design decisions & deviations

- **Guest auth is the primary flow.** Per the assessment brief, "Continue as Guest" is the
  required CTA; Google OAuth is implemented end-to-end (strategy, controller, token exchange)
  but naturally can't be exercised without real `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
  values — the app still boots cleanly with placeholder credentials, and `/auth/google` will
  return a clear error if hit before real credentials are configured.
- **No RBAC/permission layer.** Unlike the source admin-portal blueprint (which has
  SuperAdmin/role-based `PermissionGuard`), this is a workspace-collaboration app: authorization
  is simply "are you a member of this task's/project's workspace", enforced in each service via
  `WorkspacesService.assertUserIsMember()`. `JwtAuthGuard` is the only guard chained on protected
  routes.
- **Comments & Activity have no top-level controller.** Both are exposed only as nested routes
  under `/tasks/:id/...` per the SOW's representative endpoint list — their services are
  standalone/exported (`CommentsModule`, `ActivityModule`) so `TasksModule` composes them, keeping
  authorization (workspace membership) centralized in `TasksService`.
- **Activity log entries are generated automatically** by diffing the incoming `UpdateTaskDto`
  against the current task inside `TasksService.update()` (status/priority/assignee/label/
  due-date/title/description changes), matching the "You changed priority from No priority to
  Urgent" pattern from the reference screens — no separate write endpoint is needed for this.
  Posting a comment likewise appends a `comment` activity entry automatically.
- **Default workspace auto-creation.** Both `/auth/guest` and the Google OAuth callback
  auto-create a workspace named "Dexter" (matching the sample workspace shown in the reference
  UI) on first login, so the frontend has somewhere to land immediately — no separate onboarding
  step is required.
- **Full-text search uses regex, not Mongo `$text`.** Keeps sort-by-any-field and search
  composable in the same query without fighting `$text`'s "can only sort by relevance" limitation
  — acceptable at this scale; a `$text`/Atlas Search upgrade path is straightforward if the
  dataset grows.
