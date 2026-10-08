# 🏠 RoomMate Pro — Room & Money Management System

A production-ready **MERN stack** application for managing a shared room or flat — tracking monthly expenses, splitting bills, recording payments, assigning pending work to members, and maintaining a detailed financial ledger.

---

## ✨ Features at a Glance

| Feature | Admin | Member |
|---|---|---|
| Login (ENV-secured) | ✅ | ✅ (Admin-created only) |
| Create / Edit / Delete Members | ✅ | ❌ |
| Add Room Expenses (Grocery, Rent, Electricity, etc.) | ✅ | ✅ (if permitted) |
| Auto expense splitting among active members | ✅ | ✅ |
| Custom split amounts per member | ✅ | ❌ |
| Record member rent/settlement payments | ✅ | ✅ |
| Upload receipt photos | ✅ | ✅ |
| Monthly Ledger + Carryover Balances | ✅ | Self only |
| Balance Adjustments (Admin corrections) | ✅ | ❌ |
| Pending Task Assignment with priorities | ✅ | View/Update own |
| Task status workflow: Pending → In Progress → Completed | ✅ | ✅ |
| Task work history/timeline | ✅ | View own |
| Room Settings (currency, room name, member perms) | ✅ | ❌ |
| Responsive design (mobile + desktop) | ✅ | ✅ |

---

## 🔐 Security Model

- **No public signup**. Only Admin can create member accounts.
- Admin credentials are **never stored in the React frontend**. They are read exclusively from `backend/.env`.
- All member passwords are hashed with **bcryptjs**.
- All API endpoints are protected by **JWT Bearer token** middleware.
- **Role-based access control (RBAC)**: Admin and Member roles with separate scopes.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6, Axios |
| Backend | Node.js, Express.js (ESM modules) |
| Database | MongoDB (Mongoose) |
| Auth | JWT (30-day tokens) |
| File Uploads | Multer (up to 10MB photos) |
| Icons | Lucide React |
| Deployment | Render (free tier) |

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js v18+ (v23 recommended)
- MongoDB running locally on port 27017 OR a MongoDB Atlas connection string

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in your values:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/room_manager
JWT_SECRET=your_super_secret_jwt_key_here
ADMIN_EMAIL=admin@roommate.com
ADMIN_PASSWORD=YourStrongAdminPassword
ADMIN_NAME=Head Administrator
NODE_ENV=development
```

> ⚠️ **IMPORTANT**: Never commit `.env` to Git. It is listed in `.gitignore`.

### 3. Start the Application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend (development proxy):**
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

### Default Admin Login (local dev)
```
Email:    admin@roommate.com
Password: Admin@Room2026
```

---

## 📂 Project Structure

```
mern-room-manager/
├── backend/
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js   # Login, profile
│   │   ├── memberController.js # CRUD members, balance adjustments
│   │   ├── expenseController.js # Expense tracking with splits
│   │   ├── paymentController.js # Rent & settlement records
│   │   ├── taskController.js   # Pending work management
│   │   ├── summaryController.js # Monthly ledger + dashboard
│   │   └── settingsController.js # Room configuration
│   ├── middleware/
│   │   ├── auth.js             # JWT protect, adminOnly, memberOrAdmin
│   │   └── upload.js           # Multer file upload
│   ├── models/
│   │   ├── User.js             # Members + Admin (bcrypt hash)
│   │   ├── Expense.js          # Expense with split
│   │   ├── Payment.js          # Rent and settlements
│   │   ├── Task.js             # Pending work with history
│   │   ├── BalanceAdjustment.js # Manual admin corrections
│   │   └── RoomSettings.js    # Room configuration
│   ├── routes/                 # Express routers per domain
│   ├── utils/
│   │   └── seedAdmin.js       # Auto-creates Admin from .env
│   ├── .env                    # Secret credentials (NOT committed)
│   ├── .env.example           # Safe template for reference
│   └── server.js              # Entry point
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Auth state + toast notifications
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── ConfirmationModal.jsx
│   │   │   └── PhotoModal.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── MemberManagement.jsx
│   │   │   │   ├── ExpenseManagement.jsx
│   │   │   │   ├── PaymentManagement.jsx
│   │   │   │   ├── TaskManager.jsx
│   │   │   │   ├── MonthlyReports.jsx
│   │   │   │   └── SettingsPage.jsx
│   │   │   └── member/
│   │   │       ├── MemberDashboard.jsx
│   │   │       ├── MyExpenses.jsx
│   │   │       ├── MyPayments.jsx
│   │   │       ├── MyTasks.jsx
│   │   │       └── MyProfile.jsx
│   │   ├── services/
│   │   │   └── api.js          # Axios client with JWT interceptor
│   │   ├── App.jsx            # Routes + RBAC guards
│   │   └── main.jsx
│   └── vite.config.js
├── .gitignore
├── render.yaml                 # Render.com deployment blueprint
└── README.md
```

---

## ☁️ Deploy on Render (Production)

### Option A — Render Blueprint (Recommended)

1. Push this repo to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com).
3. Click **New → Blueprint** and select your repo.
4. Render reads `render.yaml` automatically.
5. Set the secret environment variables in Render:
   - `MONGODB_URI` → your MongoDB Atlas connection string
   - `ADMIN_EMAIL` → your admin email
   - `ADMIN_PASSWORD` → your strong admin password

### Option B — Manual Services

**Backend Web Service:**
- Root: `/backend`
- Build Command: `npm install`
- Start: `node server.js`
- Env vars: `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NODE_ENV=production`

**Frontend Static Site:**
- Root: `/frontend`
- Build: `npm install && npm run build`
- Publish: `dist`
- Env vars: `VITE_API_URL=https://your-backend-url.onrender.com/api`
- Redirect rule: `/* → /index.html (rewrite)`

---

## 💰 Financial Calculation Logic

The monthly ledger calculates **Net Balance** for each member:

```
Net Balance = Previous CarryOver + Expenses Paid Directly + Direct Payments (to Admin)
            - Member's Expense Share - Fixed Rent Dues + Manual Adjustments
```

- **Positive Net** → Member has advance credit (paid more than owed)
- **Negative Net** → Member has pending due (owes money to the room fund)
- Balances **automatically carry forward** to the next month

---

## 📱 UI Highlights

- **Modern dark login page** with Admin/Member role tabs
- **Gradient financial hero card** for member balance status
- **Responsive sidebar** navigation (hamburger menu on mobile)
- **Toast notifications** for all actions
- **Confirmation modals** for all destructive deletes
- **Receipt/photo lightbox** for bills, task photos, payment proofs
- **Filterable tables** by month, category, member, search keyword
- **Task priority/status badges** with color coding
- **Monthly expense category breakdown** tiles

---

## 📜 License

MIT License — Modify freely for your flat's needs!

---

*Built with the MERN Stack — MongoDB, Express, React, Node.js*

## 🔔 Website + Android Push Notifications

RoomExpenses supports a shared notification architecture for the live website/PWA and the native Android app. Both register device tokens against the same authenticated backend and use Firebase Cloud Messaging (FCM). See `NOTIFICATION-SETUP.md` and `ANDROID-APP-SETUP.md` before deployment.
