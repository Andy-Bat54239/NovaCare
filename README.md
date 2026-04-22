<<<<<<< HEAD
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
=======
# NovaCare Management System

> **Smart Pharmacy Operations · Powered by Technology**

A fully integrated, production-grade web application for managing pharmacy operations across multiple branches. NovaCare digitalises every aspect of pharmacy workflows — from inventory and point-of-sale to customer ordering, real-time team communication, and compliance auditing.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [User Roles & Permissions](#user-roles--permissions)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Database (Docker)](#1-database-docker)
  - [2. Backend (ASP.NET Core)](#2-backend-aspnet-core)
  - [3. Frontend (React)](#3-frontend-react)
- [Configuration](#configuration)
  - [Backend — appsettings.json](#backend--appsettingsjson)
  - [Frontend — API Base URL](#frontend--api-base-url)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Real-Time Messaging](#real-time-messaging)
- [Authentication & Security](#authentication--security)
- [Customer Portal](#customer-portal)
- [Inventory Management (FEFO)](#inventory-management-fefo)
- [Team Allocation](#team-allocation)
- [Contributing](#contributing)
- [Branch Naming Convention](#branch-naming-convention)
- [License](#license)

---

## Overview

NovaCare is a multi-portal pharmacy management system serving four distinct user types:

| Portal | URL | Who uses it |
|--------|-----|-------------|
| **Staff Dashboard** | `/dashboard` | Admin, Manager, Pharmacist |
| **Customer Portal** | `/customer` | Registered customers |
| **Public Storefront** | `/shop` | Anonymous visitors |
| **API + Swagger** | `/swagger` | Developers |

The system is designed for multi-branch pharmacies. Each staff member is scoped to their assigned branch, while admins have system-wide visibility. Customers interact through a dedicated portal with self-registration, online ordering, and direct chat with pharmacy staff.

---

## Key Features

### Inventory & Sales
- **FEFO Batch Management** — First Expiry, First Out stock deduction on every sale. No manual batch selection required.
- **Multi-Branch Stock Visibility** — Real-time stock levels per medicine per branch.
- **Low-Stock & Expiry Alerts** — Dashboard notifications for items running low or expiring within 30 days.
- **POS Sales Interface** — Multi-item point-of-sale with automatic stock deduction and invoice generation.

### Customer & Orders
- **Customer Self-Registration** — OTP email verification with 6-digit code and 10-minute expiry.
- **Online Ordering** — Customers browse, add to cart, and place orders from the portal.
- **Prescription Gate** — Rx medicines require a prescription photo upload before being added to cart.
- **Order Approval Workflow** — Staff review, approve, reject, or complete orders from the dashboard.

### Real-Time Communication
- **Customer ↔ Staff Chat** — Branch-scoped conversations with Manager or Pharmacist teams.
- **Staff ↔ Staff Direct Chat** — Private 1-on-1 messaging restricted to same-branch colleagues.
- **Live Unread Badges** — WhatsApp-style instant badge updates via delta-based CustomEvent sync.
- **SignalR WebSocket Hub** — Group-based delivery with personal and role+branch groups.

### Administration
- **Role-Based Access Control** — 4 roles, 24 named permissions, with per-user custom overrides.
- **Comprehensive Audit Log** — Every action recorded: user, module, action, IP address, timestamp.
- **Contact Message Management** — Public contact form with staff reply and read tracking.
- **Multi-Branch Architecture** — 4 branches supported, all managed from a single system.

### Analytics & Reporting
- **Revenue Charts** — 7, 14, and 30-day sales trend charts per branch.
- **Dashboard Statistics** — Role-scoped KPIs (system-wide for Admin, branch-level for Manager, personal for Pharmacist).
- **Export-Ready Reports** — Sales, inventory, and order data surfaced for reporting.

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| ASP.NET Core | 10 | Web API framework |
| Entity Framework Core | 10 | ORM & database migrations |
| ASP.NET Core SignalR | 10 | Real-time WebSocket messaging |
| SQL Server | 2022 | Primary relational database |
| BCrypt.Net | Latest | Password hashing |
| MailKit | Latest | SMTP email delivery |
| Swashbuckle (Swagger) | Latest | API documentation |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | Latest | Build tool & dev server |
| React Router | 7 | Client-side routing & guards |
| Axios | Latest | HTTP client with JWT interceptor |
| @microsoft/signalr | Latest | SignalR WebSocket client |
| Recharts | Latest | Revenue & analytics charts |
| Lucide React | Latest | Icon library |

### Infrastructure
| Technology | Purpose |
|---|---|
| Docker | SQL Server containerisation |
| JWT (HS256) | Stateless authentication |
| EF Core Migrations | Versioned schema management |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                     │
│         React 19 SPA  ·  Vite  ·  React Router 7        │
│     Staff Dashboard  ·  Customer Portal  ·  Public Shop  │
└──────────────────────────┬──────────────────────────────┘
                           │  REST (Axios + JWT)
                           │  WebSocket (SignalR)
┌──────────────────────────▼──────────────────────────────┐
│                   APPLICATION LAYER                      │
│     ASP.NET Core 10  ·  13 Controllers  ·  SignalR Hub   │
│         JWT Auth  ·  BCrypt  ·  MailKit  ·  EF Core      │
└──────────────────────────┬──────────────────────────────┘
                           │  EF Core ORM
┌──────────────────────────▼──────────────────────────────┐
│                     DATA LAYER                           │
│     SQL Server 2022 (Docker)  ·  15+ Entities            │
│         9 Migrations  ·  FEFO Logic  ·  Seed Data        │
└─────────────────────────────────────────────────────────┘
```

**Real-Time Layer (SignalR)**
- Every user joins `user-{userId}` (personal group)
- Staff join `role-{role}-branch-{branchId}` (branch-scoped role group)
- JWT authentication via query string (`?access_token=...`) for WebSocket connections

---

## User Roles & Permissions

| Role | ID | Access Level | Key Capabilities |
|------|----|-------------|-----------------|
| **Admin** | 1 | System-wide | All 24 permissions · User management · System analytics · Audit log |
| **Manager** | 2 | Branch-scoped | Order approvals · Branch revenue · Inventory oversight · Contact replies |
| **Pharmacist** | 3 | Branch-scoped | POS sales (FEFO) · Batch management · Customer chat |
| **Customer** | 4 | Portal only | Browse medicines · Place orders · Upload Rx · Chat with staff |

### Permission System
The system defines **24 named permissions** (e.g. `ViewMedicines`, `CreateSales`, `ViewAuditLog`). Each role has default permissions. Admins can grant custom permission sets to individual staff members, overriding role defaults. Permissions are resolved server-side at login and embedded in the JWT response.

---

## Prerequisites

Before running NovaCare, ensure you have the following installed:

| Requirement | Version | Check |
|---|---|---|
| [.NET SDK](https://dotnet.microsoft.com/download) | 10.0+ | `dotnet --version` |
| [Node.js](https://nodejs.org) | 18.0+ | `node --version` |
| [Docker Desktop](https://www.docker.com/products/docker-desktop) | Latest | `docker --version` |
| [Git](https://git-scm.com) | Any | `git --version` |

---

## Getting Started

### 1. Database (Docker)

Pull and start the SQL Server container:

```bash
docker run -e "ACCEPT_EULA=Y" \
           -e "MSSQL_SA_PASSWORD=YourStrong@Passw0rd" \
           -p 1433:1433 \
           --name sql_server \
           -d mcr.microsoft.com/mssql/server:2022-latest
```

Verify it is running:

```bash
docker ps
# You should see: sql_server   Up X minutes   0.0.0.0:1433->1433/tcp
```

> **Note:** The API calls `dbContext.Database.Migrate()` on startup, so migrations and seed data are applied automatically the first time you run the backend. No manual `dotnet ef database update` is required.

---

### 2. Backend (ASP.NET Core)

```bash
# Navigate into the backend project
cd NovaCare.API

# Restore dependencies and build
dotnet build

# Run the API (default: http://localhost:5232)
dotnet run
```

Once running:
- **API base URL:** `http://localhost:5232/api`
- **Swagger UI:** `http://localhost:5232/swagger`
- **SignalR Hub:** `ws://localhost:5232/hubs/chat`

The first startup will:
1. Apply all 9 EF Core migrations to the database
2. Seed branches, staff users, medicines, and customers
3. Seed batch stock data (300 batches across 3 active branches)

**Default staff credentials (development only):**

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@novacare.rw` | `admin123` |
| Manager (Branch 1) | `rachel@novacare.rw` | `manager123` |
| Manager (Branch 2) | `marcus@novacare.rw` | `manager123` |
| Manager (Branch 3) | `fatima@novacare.rw` | `manager123` |
| Pharmacist (Branch 1) | `james@novacare.rw` | `pharma123` |
| Pharmacist (Branch 2) | `sophie@novacare.rw` | `pharma123` |

> ⚠️ These are development seed credentials. Change them before any deployment.

---

### 3. Frontend (React)

```bash
# Navigate into the frontend project
cd novacare-frontend

# Install dependencies
npm install

# Start the Vite dev server
npm run dev
```

The dev server starts on `http://localhost:5173` (falls back to `5174` or `5175` if the port is in use — all three are whitelisted in the API's CORS policy).

**Other frontend commands:**

```bash
npm run build    # Production build → dist/
npm run lint     # ESLint (flat config in eslint.config.js)
npm run preview  # Preview the production build locally
```

---

## Configuration

### Backend — appsettings.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=NovaCareDB;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True"
  },
  "Jwt": {
    "Key": "your-secret-key-min-32-characters",
    "Issuer": "NovaCareAPI",
    "Audience": "NovaCareClient"
  },
  "Smtp": {
    "Host": "smtp.gmail.com",
    "Port": 587,
    "Username": "your-email@gmail.com",
    "Password": "your-app-password",
    "FromName": "NovaCare Pharmacy"
  }
}
```

| Key | Description |
|-----|-------------|
| `ConnectionStrings:DefaultConnection` | SQL Server connection string. Update `Password` to match your Docker container's SA password. |
| `Jwt:Key` | HS256 signing key — must be at least 32 characters. Keep this secret. |
| `Smtp:*` | Gmail SMTP settings. Use a [Google App Password](https://support.google.com/accounts/answer/185833) — not your regular password. |

### Frontend — API Base URL

The API base URL is configured in `novacare-frontend/src/api/axios.js`:

```js
const api = axios.create({
  baseURL: 'http://localhost:5232/api',
});
```

Update this value when deploying to a remote server.

---

## Project Structure

```
NovaCare Management System/
│
├── NovaCare.API/                     # ASP.NET Core 10 Web API
│   ├── Controllers/                  # 13 API controllers
│   │   ├── AuthController.cs         # Registration, login, OTP
│   │   ├── UsersController.cs        # Staff user management
│   │   ├── MedicinesController.cs    # Medicine catalogue & images
│   │   ├── BatchesController.cs      # Stock batch management
│   │   ├── SalesController.cs        # POS sales (FEFO)
│   │   ├── OrdersController.cs       # Customer orders & approvals
│   │   ├── CustomersController.cs    # Walk-in & portal customers
│   │   ├── ChatsController.cs        # Customer ↔ staff conversations
│   │   ├── StaffChatsController.cs   # Staff ↔ staff direct messages
│   │   ├── DashboardController.cs    # Stats, notifications, charts
│   │   ├── ContactMessagesController.cs
│   │   ├── AuditLogsController.cs
│   │   └── BranchesController.cs
│   ├── Hubs/
│   │   └── ChatHub.cs                # SignalR WebSocket hub
│   ├── Models/                       # 13 EF Core entity models
│   ├── Data/
│   │   └── AppDbContext.cs           # DbContext + seed data
│   ├── Migrations/                   # 9 EF Core migrations
│   ├── Services/
│   │   ├── AuditService.cs           # Action logging
│   │   └── EmailService.cs           # OTP & notification emails
│   ├── Helpers/
│   │   └── JwtHelper.cs              # JWT token generation
│   ├── DTOs/
│   │   └── AuthDtos.cs               # Request / response records
│   ├── Program.cs                    # App configuration & middleware
│   └── appsettings.json              # Connection strings, JWT, SMTP
│
└── novacare-frontend/                # React 19 + Vite SPA
    └── src/
        ├── api/                      # 15 Axios API modules + SignalR
        ├── components/               # MedicineImage, NotificationBell
        ├── context/                  # AuthContext, CartContext
        ├── data/                     # Permissions, mock/static data
        ├── layouts/                  # DashboardLayout, CustomerLayout, ShopLayout
        ├── pages/
        │   ├── dashboard/            # 15 staff dashboard pages
        │   ├── customer/             # 6 customer portal pages
        │   └── shop/                 # 7 public storefront pages
        ├── styles/
        │   └── global.css            # CSS custom properties & design system
        └── App.jsx                   # Routing, guards, route structure
```

---

## API Reference

All endpoints (except those marked public) require a `Bearer` JWT token in the `Authorization` header.

### Authentication — `/api/auth`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/login` | Public | Staff & customer login — returns JWT |
| `POST` | `/register` | Public | Customer self-registration — triggers OTP email |
| `POST` | `/verify-otp` | Public | Verify OTP code — activates account |
| `POST` | `/resend-otp` | Public | Resend OTP to email |
| `POST` | `/logout` | JWT | Log out (audit trail only) |

### Users — `/api/users`
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | List all users |
| `POST` | `/` | Create staff user (sends temp password email) |
| `PUT` | `/{id}` | Update user |
| `DELETE` | `/{id}` | Delete user |
| `PUT` | `/me` | Update own profile (name) |
| `POST` | `/me/password` | Change own password |
| `POST` | `/{id}/password` | Admin: reset user password |
| `GET/POST` | `/{id}/permissions` | Get / set custom permissions |

### Medicines — `/api/medicines`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | Public | List medicines (searchable) |
| `GET` | `/{id}` | Public | Get single medicine |
| `GET` | `/categories` | Public | List distinct categories |
| `GET` | `/stock` | JWT | Stock by branch (batch data) |
| `POST` | `/` | JWT | Create medicine |
| `PUT` | `/{id}` | JWT | Update medicine |
| `DELETE` | `/{id}` | JWT | Delete medicine |
| `POST` | `/upload-image` | JWT | Upload medicine image |

### Orders — `/api/orders`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | JWT | List all orders (staff) |
| `POST` | `/` | Public | Place order (anonymous or logged-in customer) |
| `GET` | `/my` | JWT (role=4) | Customer's own orders |
| `PATCH` | `/{id}/status` | JWT | Update order status |
| `POST` | `/{orderId}/items/{itemId}/prescription` | Public | Upload prescription image |

### Chat — `/api/chats`
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | List conversations (role-scoped) |
| `POST` | `/` | Customer creates conversation with a staff role |
| `GET` | `/{id}/messages` | Paginated messages |
| `GET` | `/unread-count` | Combined chat + staff-chat unread count |
| `GET` | `/customers` | Staff: list customers for initiating chat |
| `GET` | `/branches` | Customer: list active branches |

### Staff Chat — `/api/staff-chats`
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | List staff direct conversations |
| `POST` | `/` | Open or retrieve conversation with a colleague |
| `GET` | `/{id}/messages` | Messages (auto-marks received as read) |
| `GET` | `/unread-count` | Staff-to-staff unread count |
| `GET` | `/colleagues` | List same-branch active staff |

> Complete API documentation available at `http://localhost:5232/swagger` when the backend is running.

---

## Database Schema

### Core Entities

```
Users ──────────┬── BranchId → Branches
                ├── Role (1=Admin, 2=Manager, 3=Pharmacist, 4=Customer)
                └── Permissions (JSON array, nullable)

Medicines ──────┬── Batches ── BranchId → Branches
                │              (RemainingQuantity, ExpiryDate)
                └── OrderItems, SaleItems

Sales ──────────┬── BranchId → Branches
                ├── UserId → Users
                └── SaleItems → Medicines (FEFO deduction)

Orders ─────────┬── BranchId → Branches
                ├── CustomerUserId → Users (nullable, role=4)
                └── OrderItems → Medicines (+ PrescriptionImagePath)

ChatConversations ── CustomerUserId → Users
                  ── TargetRole (1/2/3)
                  ── BranchId → Branches
                  └── ChatMessages

StaffConversations ── User1Id → Users (User1Id < User2Id)
                   ── User2Id → Users
                   └── StaffMessages

ContactMessages ── BranchId → Branches (nullable)
AuditLogs ──────── UserId → Users
```

**Key conventions:**
- All FK relationships use `OnDelete(DeleteBehavior.NoAction)` — avoids SQL Server multiple cascade path errors
- Money columns use `decimal(12, 2)` precision
- No dynamic values in `HasData` seed — EF Core would flag them as `PendingModelChangesWarning`

---

## Real-Time Messaging

NovaCare uses ASP.NET Core SignalR for all real-time features.

### Hub Endpoint
```
ws://localhost:5232/hubs/chat?access_token=<JWT>
```

JWT is passed as a query parameter because WebSocket connections cannot set custom headers.

### SignalR Groups

| Group Name | Who joins | Purpose |
|---|---|---|
| `user-{userId}` | Every connected user | Personal delivery |
| `role-{role}-branch-{branchId}` | Staff only | Branch-scoped role broadcast |

### Hub Methods (client → server)

| Method | Parameters | Description |
|--------|-----------|-------------|
| `SendMessage` | `conversationId, content` | Send message in a customer conversation |
| `StartConversation` | `customerUserId, targetRole` | Staff initiates chat with a customer |
| `MarkRead` | `conversationId` | Mark customer conversation messages as read |
| `SendStaffMessage` | `conversationId, content` | Send message in a staff direct conversation |
| `MarkStaffRead` | `conversationId` | Mark staff conversation messages as read |

### Events (server → client)

| Event | Payload | Triggered by |
|-------|---------|-------------|
| `ReceiveMessage` | Message object | New message in a customer conversation |
| `NewConversation` | Conversation object | Customer conversation created |
| `ConversationStarted` | `conversationId` | Confirms conversation ID to initiating staff |
| `ReceiveStaffMessage` | Message object | New message in a staff direct conversation |

---

## Authentication & Security

### JWT Token
- **Algorithm:** HS256
- **Expiry:** 8 hours
- **Claims:** `sub` (userId), `role`, `branchId`, email, given name, surname
- `mapInboundClaims = false` — claims are read using their short names (e.g. `"role"`, not the full URI)

### Password Security
- Passwords are hashed using **BCrypt** with adaptive cost factor
- Staff accounts are created with a temporary password sent by email; users are forced to change it on first login
- Customers set their own password at registration

### OTP Verification
- 6-digit random code generated using `Random.Shared.Next(100000, 999999)`
- Stored on the `User` record with a 10-minute expiry timestamp
- Cleared from the database immediately after successful verification
- Email delivery is non-blocking — failures are logged but do not prevent account creation

### File Upload Validation
| Upload type | Max size | Allowed formats |
|---|---|---|
| Medicine images | 5 MB | `.jpg`, `.jpeg`, `.png`, `.webp` |
| Prescription images | 5 MB | `.jpg`, `.jpeg`, `.png`, `.pdf` |

---

## Customer Portal

Customers access a dedicated portal at `/customer/*`, completely separate from the staff dashboard.

### Registration Flow
1. Visit `/login` → **Create Account** tab
2. Enter name, email and password → `POST /api/auth/register`
3. Receive 6-digit OTP by email → enter on verification screen
4. Account activated → sign in → redirected to Customer Portal

### Portal Features
- **Home** — Welcome dashboard with stats, recent orders, and in-stock medicines
- **Medicines** — Browse all medicines with branch stock levels; add to cart with Rx prescription gate
- **Cart / Checkout** — Name and email auto-filled from session; only branch selection required
- **My Orders** — Full order history with status tracking
- **Chat** — Real-time messaging with Manager and Pharmacist teams
- **Profile** — Edit name, phone, address (synced to customer table for staff visibility)

---

## Inventory Management (FEFO)

**First Expiry, First Out** is implemented in `SalesController.Create`:

```
For each sale item:
  1. Fetch all non-expired batches for this medicine + branch with stock > 0
  2. Order by ExpiryDate ascending (earliest expiry first)
  3. Walk through batches, decrementing RemainingQuantity until qty is satisfied
  4. Save all modified batches in one SaveChanges call
```

This logic runs automatically on every sale. Pharmacists never need to manually select a batch. The same pattern must be followed for any future return or adjustment logic.

---

## Team Allocation

The codebase is divided across four developers:

| Dev | Area | Key Files |
|-----|------|-----------|
| **Biyonga Bahati Andy** | Backend Core (Auth, Users, Data) | `AuthController`, `UsersController`, `AppDbContext`, `JwtHelper`, `Migrations/`, `Program.cs` |
| **Iriza Linda** | Backend Business Logic (Inventory, Sales, Chat) | `MedicinesController`, `SalesController`, `OrdersController`, `ChatsController`, `ChatHub` |
| **Umutoniwase Cynthia Adeline** | Frontend — Staff Dashboard & Auth | `DashboardLayout`, `Chats.jsx`, `ContactMessages.jsx`, `Users.jsx`, `Login.jsx`, `AuthContext` |
| **Irakoze Jessica** | Frontend — Customer Portal & Shop | `CustomerLayout`, `CustomerMedicines`, `CustomerCheckout`, `CustomerProfile`, `Customers.jsx` |

### Branch Naming Convention

```
{studentId}_{Area}
```

Examples: `26764_Backendone`, `26248_Backendtwo`, `26754_Frontendone`, `26026_Frontendtwo`

---

## Contributing

1. **Clone the repository**
   ```bash
   git clone https://github.com/Andy-Bat54239/NovaCare.git
   cd NovaCare
   ```

2. **Check out your assigned branch**
   ```bash
   git checkout -b {yourId}_{YourArea}
   ```

3. **Make your changes** — only touch files allocated to your role (see Team Allocation above)

4. **Stage only your files** — never use `git add .` or `git add -A`
   ```bash
   git add NovaCare.API/Controllers/YourController.cs
   ```

5. **Commit with a descriptive message**
   ```bash
   git commit -m "feat(area): short description of what was done"
   ```

6. **Push your branch**
   ```bash
   git push -u origin {yourId}_{YourArea}
   ```

7. **Open a Pull Request** on GitHub targeting `main`

### Commit Message Format
```
type(scope): description

Types: feat · fix · chore · refactor · docs · style
```

### Critical Rules
- **Migrations folder** is owned exclusively by Dev 1 — never run `dotnet ef migrations add` without coordinating
- **`AppDbContext.cs`** is owned by Dev 1 — request changes via PR
- **Never commit** `bin/`, `obj/`, `node_modules/`, or `.env` files
- **Never commit** production secrets to `appsettings.json`
- All FK relationships must use `OnDelete(DeleteBehavior.NoAction)`

---

## License

This project is developed for academic purposes.  
© 2026 NovaCare Team — All rights reserved.
>>>>>>> 0f46c9ca91b8b31fa8a000cd3d1f13673becf3a4
