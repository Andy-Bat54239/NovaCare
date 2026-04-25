# NovaCare.API

> ASP.NET Core 10 Web API for the NovaCare Pharmacy Management System

This project provides the REST API and real-time WebSocket backend for NovaCare. It powers the React frontend (staff dashboard, customer portal, and public storefront) with JWT authentication, SignalR messaging, FEFO inventory management, and comprehensive audit logging.

---

## Tech Stack

| Technology             | Version | Purpose                                   |
| ---------------------- | ------- | ----------------------------------------- |
| ASP.NET Core           | 10.0    | Web API framework                         |
| Entity Framework Core  | 10.0    | ORM & database migrations                 |
| ASP.NET Core SignalR   | 10.0    | Real-time WebSocket messaging             |
| SQL Server             | 2022    | Primary relational database               |
| BCrypt.Net-Next        | 4.1.0   | Password hashing                          |
| MailKit                | 4.16.0  | SMTP email delivery (OTP & notifications) |
| Swashbuckle.AspNetCore | 6.9.0   | Swagger / OpenAPI documentation           |

---

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download) (`dotnet --version`)
- SQL Server or [Docker Desktop](https://www.docker.com/products/docker-desktop) for the SQL Server container
- (Optional) SMTP credentials for OTP email delivery

---

## Getting Started

### 1. Start the Database

Using Docker:

```bash
docker run -e "ACCEPT_EULA=Y" \
           -e "MSSQL_SA_PASSWORD=YourStrong@Passw0rd" \
           -p 1433:1433 \
           --name sql_server \
           -d mcr.microsoft.com/mssql/server:2022-latest
```

### 2. Configure `appsettings.json`

Update the following sections:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=NovaCareDB;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True"
  },
  "Jwt": {
    "Key": "your-secret-key-min-32-characters-long",
    "Issuer": "NovaCareAPI",
    "Audience": "NovaCareClient"
  },
  "Smtp": {
    "Host": "smtp.gmail.com",
    "Port": 587,
    "UseSsl": false,
    "Username": "your-email@gmail.com",
    "Password": "your-app-password",
    "FromEmail": "your-email@gmail.com",
    "FromName": "NovaCare"
  }
}
```

> **Security:** Never commit production secrets. The `Jwt:Key` must be at least 32 characters. Use a [Google App Password](https://support.google.com/accounts/answer/185833) for SMTP, not your regular Gmail password.

### 3. Run the API

```bash
cd NovaCare.API

# Restore & build
dotnet build

# Run (default: http://localhost:5232)
dotnet run
```

On first startup, the API automatically:

1. Applies all EF Core migrations
2. Seeds branches, staff users, medicines, and customers
3. Seeds 300+ inventory batches across 3 active branches

### 4. Verify

- **Swagger UI:** `http://localhost:5232/swagger`
- **API Base:** `http://localhost:5232/api`
- **SignalR Hub:** `ws://localhost:5232/hubs/chat`

---

## Default Seed Credentials (Development)

| Role                  | Email                | Password     |
| --------------------- | -------------------- | ------------ |
| Admin                 | `admin@novacare.rw`  | `admin123`   |
| Manager (Branch 1)    | `rachel@novacare.rw` | `manager123` |
| Manager (Branch 2)    | `marcus@novacare.rw` | `manager123` |
| Manager (Branch 3)    | `fatima@novacare.rw` | `manager123` |
| Pharmacist (Branch 1) | `james@novacare.rw`  | `pharma123`  |
| Pharmacist (Branch 2) | `sophie@novacare.rw` | `pharma123`  |

> ⚠️ Change these before any production deployment.

---

## Project Structure

```
NovaCare.API/
├── Controllers/              # 13 API controllers
│   ├── AuthController.cs     # Login, register, OTP verification
│   ├── UsersController.cs    # Staff user management & permissions
│   ├── MedicinesController.cs# Medicine catalog & images
│   ├── BatchesController.cs  # Stock batch (FEFO) management
│   ├── SalesController.cs    # POS sales with automatic FEFO deduction
│   ├── OrdersController.cs   # Customer orders & approval workflow
│   ├── CustomersController.cs# Walk-in & registered customers
│   ├── ChatsController.cs    # Customer ↔ staff conversations
│   ├── StaffChatsController.cs # Staff ↔ staff direct messages
│   ├── DashboardController.cs# Stats, KPIs, notifications, revenue charts
│   ├── ContactMessagesController.cs
│   ├── AuditLogsController.cs
│   └── BranchesController.cs
├── Hubs/
│   └── ChatHub.cs            # SignalR real-time messaging hub
├── Models/                   # 13 EF Core entity models
├── Data/
│   └── AppDbContext.cs       # DbContext, seed data, relationships
├── Migrations/               # 9 EF Core versioned migrations
├── Services/
│   ├── AuditService.cs       # Action logging to AuditLog table
│   └── EmailService.cs       # OTP & notification email delivery
├── Helpers/
│   └── JwtHelper.cs          # JWT token generation & validation
├── DTOs/
│   └── AuthDtos.cs           # Auth request/response records
├── Program.cs                # App configuration, middleware, DI
├── appsettings.json          # Connection strings, JWT, SMTP
└── Dockerfile                # Container build instructions
```

---

## Key Features

### Authentication & Authorization

- **JWT Bearer** tokens (HS256, 8-hour expiry)
- **BCrypt** password hashing with adaptive cost
- **4 roles:** Admin (1), Manager (2), Pharmacist (3), Customer (4)
- **24 named permissions** with per-user custom overrides
- Staff accounts created with temporary passwords; forced change on first login
- Customer self-registration with **6-digit OTP** email verification (10-minute expiry)

### Real-Time Messaging (SignalR)

- **Customer ↔ Staff Chat:** Branch-scoped conversations with Manager/Pharmacist teams
- **Staff ↔ Staff Chat:** Private 1-on-1 messaging restricted to same-branch colleagues
- **Group-based delivery:** `user-{userId}` (personal) and `role-{role}-branch-{branchId}` (broadcast)
- JWT passed via `?access_token=<token>` query parameter for WebSocket connections

### Inventory Management (FEFO)

**First Expiry, First Out** is enforced automatically in `SalesController.Create`:

1. Fetch all non-expired batches for the medicine + branch with `RemainingQuantity > 0`
2. Order by `ExpiryDate` ascending (earliest expiry first)
3. Walk through batches, decrementing `RemainingQuantity` until the sale quantity is satisfied
4. Save all modified batches in a single `SaveChanges` call

### Audit Logging

Every significant action is recorded with:

- User ID, module, action type
- IP address and timestamp
- Queryable via `AuditLogsController`

### File Uploads

| Type                | Max Size | Allowed Formats                  |
| ------------------- | -------- | -------------------------------- |
| Medicine images     | 5 MB     | `.jpg`, `.jpeg`, `.png`, `.webp` |
| Prescription images | 5 MB     | `.jpg`, `.jpeg`, `.png`, `.pdf`  |

Stored in `wwwroot/uploads/` and served via static files middleware.

---

## API Endpoints Overview

### Auth — `/api/auth`

- `POST /login` — Staff & customer login (returns JWT)
- `POST /register` — Customer registration (triggers OTP email)
- `POST /verify-otp` — Activate account with 6-digit code
- `POST /resend-otp` — Resend OTP email
- `POST /logout` — Log out (audit trail)

### Users — `/api/users`

- `GET /` — List all users
- `POST /` — Create staff user (sends temp password)
- `PUT /{id}` — Update user
- `DELETE /{id}` — Delete user
- `PUT /me` — Update own profile
- `POST /me/password` — Change own password
- `POST /{id}/password` — Admin reset password
- `GET/POST /{id}/permissions` — Get/set custom permissions

### Medicines — `/api/medicines`

- `GET /` — List medicines (public, searchable)
- `GET /{id}` — Get single medicine (public)
- `GET /categories` — List distinct categories (public)
- `GET /stock` — Stock by branch (JWT)
- `POST /` — Create medicine
- `PUT /{id}` — Update medicine
- `DELETE /{id}` — Delete medicine
- `POST /upload-image` — Upload medicine image

### Orders — `/api/orders`

- `GET /` — List all orders (staff)
- `POST /` — Place order (public)
- `GET /my` — Customer's own orders
- `PATCH /{id}/status` — Update order status
- `POST /{orderId}/items/{itemId}/prescription` — Upload prescription

### Chat — `/api/chats`

- `GET /` — List conversations (role-scoped)
- `POST /` — Customer creates conversation
- `GET /{id}/messages` — Paginated messages
- `GET /unread-count` — Combined unread count

### Staff Chat — `/api/staff-chats`

- `GET /` — List staff direct conversations
- `POST /` — Open conversation with colleague
- `GET /{id}/messages` — Messages (auto-marks as read)
- `GET /unread-count` — Unread staff-to-staff count
- `GET /colleagues` — List same-branch active staff

> Full interactive documentation is available at `/swagger` when running in Development mode.

---

## Database Schema

### Core Entities

- `Users` — Staff & customer accounts (role, branch, permissions JSON)
- `Medicines` — Product catalog
- `Batches` — FEFO stock batches (remaining quantity, expiry date, branch)
- `Sales` / `SaleItems` — POS transactions with automatic batch deduction
- `Orders` / `OrderItems` — Customer online orders with prescription uploads
- `ChatConversations` / `ChatMessages` — Customer-staff messaging
- `StaffConversations` / `StaffMessages` — Staff direct messaging
- `ContactMessages` — Public contact form submissions
- `AuditLogs` — Action audit trail
- `Branches` — Pharmacy branch locations

### Conventions

- All foreign keys use `OnDelete(DeleteBehavior.NoAction)` to avoid SQL Server cascade path errors
- Money columns use `decimal(12, 2)` precision
- Seed data uses static values to prevent `PendingModelChangesWarning`

---

## Environment Variables

| Variable       | Purpose                | Example                       |
| -------------- | ---------------------- | ----------------------------- |
| `FRONTEND_URL` | Production CORS origin | `https://novacare.vercel.app` |

If `FRONTEND_URL` is not set, CORS allows the three default Vite dev ports (`5173`, `5174`, `5175`).

---

## Contributing

1. Never commit `bin/`, `obj/`, or `.env` files
2. Never commit production secrets to `appsettings.json`
3. All FK relationships must use `OnDelete(DeleteBehavior.NoAction)`
4. Migrations are applied automatically on startup — coordinate before adding new ones
5. Run `dotnet build` before committing to verify no compilation errors

---

## License

This project is developed for academic purposes.  
© 2026 NovaCare Team — All rights reserved.
