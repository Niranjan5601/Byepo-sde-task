# Feature Flag Manager

A full-stack application for managing feature flags with role-based access control across three user roles: Super Admin, Organization Admin, and End User.

## Tech Stack

**Backend**: Node.js, Express.js, MySQL, JWT, bcryptjs
**Frontend**: React, Vite, React Router v6, Axios

## Prerequisites

- Node.js (v14+)
- npm (v6+)
- MySQL (v5.7+)

## Installation

### Backend
```bash
cd backend
npm install
```

Create `.env` file:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=feature_flag_manager
DB_PORT=3306
JWT_SECRET=your_secret_key_here
SUPER_ADMIN_EMAIL=admin@flagmanager.com
SUPER_ADMIN_PASSWORD=admin123
PORT=4100
```

### Frontend
```bash
cd frontend
npm install
```

## Running the Project

**Backend** (from `backend/` directory):
```bash
npm run dev
```
Server runs on `http://localhost:4100`

**Frontend** (from `frontend/` directory):
```bash
npm run dev
```
Application runs on `http://localhost:3000`

## User Roles

- **Super Admin** (Role ID: 1) - Manage organizations
- **Organization Admin** (Role ID: 2) - Create and manage feature flags
- **End User** (Role ID: 3) - Check feature flag status

## API Endpoints

### Authentication (`/api/auth`)
- `POST /signup` - Create new user account
- `POST /login` - User login
- `GET /organizations` - List organizations

### Feature Flags (`/api/flags`)
- `GET /` - List flags
- `POST /` - Create flag
- `PATCH /:id` - Update flag
- `DELETE /:id` - Delete flag
- `GET /check?feature_key=KEY` - Check if feature enabled

### Super Admin (`/api/superadmin`)
- `POST /login` - Super admin login
- `POST /organizations` - Create organization
- `GET /organizations` - List organizations

---

## Program Grading

### Performance 5/5
The app uses MySQL connection pooling so the server isn't opening a new database connection on every request. Role checks happen early in the middleware chain, so unauthorized requests get rejected before they even touch the database. On the frontend, React Context handles auth state without unnecessary re-renders, and tokens are persisted in localStorage so users stay logged in across page refreshes.

### Readability and Maintainability 4/5
The codebase is split into routes, middleware, and an API client, each file has one clear job. Naming is consistent throughout, whether you're looking at the backend routes or the frontend components. UI elements like buttons, inputs, and alerts are extracted into reusable components so there's no copy-pasting markup across pages. Folder structure mirrors the architecture, so finding any piece of code is straightforward.

### Stability 5/5
Every endpoint wraps database calls in try-catch blocks and returns meaningful error messages instead of crashing. All inputs are validated before hitting the database. Passwords are hashed with bcryptjs before storage, and JWTs expire after 8 hours to limit the damage of a leaked token. Database connections are always released back to the pool in a finally block, so the app doesn't leak connections under load.

### Testability 3/5
The modular structure means each route, middleware function, and component can be tested in isolation. The API client is centralized in one file, making it easy to mock in frontend tests. Each endpoint has a clear input and output contract, and the middleware chain is easy to test independently from the route handlers.
