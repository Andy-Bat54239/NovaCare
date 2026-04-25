# NovaCare Frontend

React 19 + Vite SPA for the NovaCare pharmacy management system.

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:5232`

### Setup

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd NovaCare\ Management\ System/novacare-frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create `.env` file**
   Create a `.env` file in the project root with:

   ```env
   VITE_API_URL=http://localhost:5232
   ```

   This configures the frontend to communicate with the backend API.

4. **Start development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173` (or next available port: 5174, 5175, etc.)

## Development

### Available Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm run lint     # Run ESLint checks
npm run preview  # Preview production build locally
```

## Project Structure

```
src/
  ├── api/              # API service layer (axios instances)
  │   ├── auth.js       # Authentication endpoints
  │   ├── chat.js       # Customer-staff chat
  │   ├── staffChat.js  # Staff-to-staff direct messages
  │   ├── medicines.js  # Medicine catalog
  │   ├── orders.js     # Order management
  │   └── ...
  ├── components/       # Reusable UI components
  ├── context/          # React context (Auth, permissions)
  ├── data/             # Static data (permissions, constants)
  ├── layouts/          # Main layout wrappers
  │   ├── DashboardLayout.jsx   # Admin/Manager/Pharmacist
  │   ├── CustomerLayout.jsx    # Customer portal
  │   └── ShopLayout.jsx        # Public storefront
  ├── pages/            # Page components
  │   ├── dashboard/    # Staff dashboards
  │   ├── customer/     # Customer portal pages
  │   └── shop/         # Public storefront pages
  ├── styles/           # Global CSS
  ├── App.jsx           # Main router
  └── main.jsx          # Entry point
```

## Key Technologies

- **React 19** - UI framework
- **Vite 8.0.1** - Build tool with hot module replacement
- **React Router** - Client-side routing
- **Axios** - HTTP client with interceptors
- **Lucide React** - Icon library
- **Recharts** - Charts and graphs
- **JavaScript** (not TypeScript)

## Environment Configuration

### `.env` File

```
# Required
VITE_API_URL=http://localhost:5232    # Backend API URL

# Optional (Vite dev server port)
VITE_PORT=5173
```

**Important:** The `.env` file is required for the frontend to know where the backend API is located. Without it, API calls will fail.

## Authentication

- JWT tokens issued by backend (`AuthController.Login`)
- Token stored in `localStorage['novacare_user']`
- Tokens automatically attached to all API requests via axios interceptor
- Expired tokens (401) trigger redirect to login page
- 4 user roles: Admin (1), Manager (2), Pharmacist (3), Customer (4)

## API Integration

All API calls go through `src/api/axios.js`, which:

- Attaches JWT bearer token from localStorage
- Handles 401 responses (redirects to login)
- Centralizes error handling
- Returns JSON response or empty array on error

Example API call:

```javascript
// src/api/medicines.js
import axios from "./axios";

export async function getMedicines(branchId) {
  return axios
    .get("/medicines", { params: { branchId } })
    .then((res) => res.data)
    .catch(() => []); // Returns [] on error
}
```

## Chat Features

### Architecture

- **Real-time**: SignalR WebSocket connection (`/hubs/chat`)
- **Customer ↔ Staff**: Role-based conversations (separate for Admin/Manager/Pharmacist)
- **Staff ↔ Staff**: Direct 1-on-1 messaging

### JWT for WebSocket

Tokens must be passed as `?access_token=<token>` query parameter because WebSocket connections can't set headers. See backend `Program.cs` for configuration.

### Unread Badges

Calculated locally in real-time without repeated API calls. Updates via:

- SignalR `ReceiveMessage` / `ReceiveStaffMessage` events
- Window event `novachat-read` when opening a conversation
- Polls every 30 seconds for safety

## Customer Registration & OTP

1. `POST /api/auth/register` → Creates user with `IsActive = false`, generates 6-digit OTP, sends email
2. `POST /api/auth/verify-otp` → Validates OTP, sets `IsActive = true`
3. `POST /api/auth/resend-otp` → Resends OTP if not yet verified

Frontend flow: Registration form → OTP input → Sign In

## File Uploads

Prescription images: max 5 MB, `.jpg/.jpeg/.png/.pdf` only

- Uploaded to: `/api/orders/{id}/items/{itemId}/prescription` (public endpoint)
- Stored in: `NovaCare.API/wwwroot/uploads/prescriptions/`
- Path saved in `OrderItem.PrescriptionImagePath`

## Known Issues & Quirks

- **ESLint catch bindings**: Use optional catch binding `catch { }` instead of `catch (_e)` to avoid unused variable warnings
- **JSX icon components in `.map()`**: Assign `const Icon = item.icon` in loop body; destructuring in `.map()` isn't tracked as usage
- **Port conflicts**: If 5173 is in use, Vite will try 5174, 5175, etc. All are whitelisted in API CORS
- **Frontend-backend sync**: Always verify `.env` file is correct when API calls fail

## Building for Production

```bash
npm run build
```

Outputs to `dist/` directory. Deployment notes:

- Chunk size warning (1MB+) is informational, not blocking
- Consider code-splitting for large chunks
- All environment variables must be set before build

## Troubleshooting

### "medicines.map is not a function"

The API likely returned an error object instead of an array. Check that `.env` points to correct backend URL.

### "Cannot POST /api/..."

Verify backend is running on configured `VITE_API_URL` and CORS is enabled for your frontend port.

### WebSocket disconnection

Check that JWT token is being passed correctly. WebSocket requires `?access_token=<token>` in URL.

### Chat unread count not updating

Check browser console for SignalR connection errors. Ensure `startConnection()` was called in layout component.

## Performance Tips

- Use `useMemo` for expensive calculations
- Debounce search/filter inputs
- Lazy load routes with `React.lazy()` and `<Suspense>`
- Monitor bundle size with build warnings

## Contributing

Follow these conventions:

- One feature/fix per commit with descriptive message
- Run `npm run lint` before committing
- Run `npm run build` to verify no errors
- Keep commits small and modular
- Update this README if adding new features or dependencies

## Support

For issues, check:

1. Backend is running on `http://localhost:5232`
2. `.env` file exists with correct `VITE_API_URL`
3. SQL Server database is connected
4. Browser console for errors
5. Network tab to verify API requests
