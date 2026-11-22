# CampusCart - College Second-Hand Marketplace with Auth.js

CampusCart is a full-stack web application designed for college students to buy and sell second-hand items within their campus community. Students can browse textbooks, electronics, cycles, and hostel essentials, post their own listings, manage inquiries, and administer the marketplace through role-based access control (RBAC).

---

## 🚀 Features

### 1. Authentication & Roles (Auth.js)
- **Login-First Website Architecture:** Mandatory authentication enforced via Edge Middleware (`middleware.js`). Unauthenticated visitors opening any marketplace URL (`/`, `/products/[id]`, `/dashboard`, `/admin`, etc.) are automatically redirected to `/login` with safe `callbackUrl` handling, while `/login`, `/register`, and `/api/auth/*` remain accessible.
- **Role-Based Access Control:** Two distinct roles:
  - `USER` (Student): Can browse, create listings, manage their own items, and send/receive enquiries.
  - `ADMIN` (Administrator): Can manage, moderate, edit, and delete any listing across the entire marketplace.
- **Credentials Authentication:** Email and password registration & login with salted bcrypt hashing.
- **Google OAuth Provider:** One-click Google sign-in integration.
- **Session & JWT Callbacks:** Encrypted sessions exposing verified user ID and role to both client and server.
- **Secure Registration:** Public registration strictly forces the `USER` role to prevent privilege escalation.

### 2. Marketplace & Existing Features
- **Browse Items:** Dynamic grid showing all student listings.
- **Search & Filters:** Search by name, filter by category (*Textbooks, Electronics, Stationery, Hostel & Room, Cycles & Mobility, Clothing, Other*) and condition (*Brand New, Like New, Good, Fair*).
- **Sorting:** Real-time sorting by newest, oldest, price low-to-high, and price high-to-low.
- **Status Badges:** Available (green), Reserved (orange), Sold (gray).

### 3. Ownership & Authorization
- **Item Ownership:** Every listing is associated with the authenticated student's MongoDB ID (`ownerId`).
- **Conditional UI:** Edit, Delete, and Status controls are rendered ONLY if the logged-in user is the owner or an administrator.
- **Server-Side Enforcement:** Route Handlers independently verify session identity and reject unauthorized modifications with `403 Forbidden`.

### 4. Dashboards
- **Student Profile Dashboard (`/dashboard`):**
  - Displays user profile (Name, Email, Role).
  - "My Listings" tab with status updater, edit, and delete controls.
  - "Incoming Enquiries" tab showing buyer messages, offer prices, and Accept/Reject buttons.
- **Admin Dashboard (`/admin`):**
  - Restricted strictly to `ADMIN` users (students receive `403 Access Denied`).
  - Search and filter across all campus listings.
  - Full management controls (Edit, Delete, Status change) on any student listing.

---

## 🛠️ Technology Stack

- **Framework:** Next.js (App Router)
- **Authentication:** Auth.js (`next-auth@beta`) with JWT sessions & bcryptjs
- **Frontend:** React Client Components with clean, responsive CSS
- **Backend:** Next.js API Route Handlers
- **Database:** MongoDB Atlas (Cloud Database)
- **ODM:** Mongoose
- **Deployment:** Vercel

---

## 📁 Project Structure

```text
├── app/
│   ├── admin/
│   │   └── page.js               # Protected Admin Dashboard
│   ├── api/
│   │   ├── admin/
│   │   │   └── promote/route.js  # Protected administrator promotion
│   │   ├── auth/
│   │   │   ├── [...nextauth]/    # Auth.js Route Handler
│   │   │   └── register/         # Secure student registration endpoint
│   │   ├── enquiries/
│   │   │   ├── route.js          # GET & POST enquiries (scoped to seller)
│   │   │   └── [id]/route.js     # PATCH status & DELETE enquiry
│   │   ├── products/
│   │   │   ├── route.js          # GET (list/filter) & POST (authenticated)
│   │   │   └── [id]/route.js     # GET, PUT (owner/admin), DELETE (owner/admin)
│   │   └── test-db/route.js      # Database health check
│   ├── dashboard/
│   │   └── page.js               # Protected Student Dashboard
│   ├── login/
│   │   └── page.js               # Credentials & Google Sign-In
│   ├── register/
│   │   └── page.js               # Student registration form
│   ├── products/
│   │   ├── [id]/
│   │   │   ├── page.js           # Item details & enquiry submission
│   │   │   └── edit/page.js      # Edit listing (owner/admin protected)
│   │   └── new/page.js           # Post new listing (authenticated)
│   ├── globals.css               # Clean responsive styling
│   ├── layout.js                 # Global navbar & SessionProvider
│   └── page.js                   # Marketplace homepage
├── components/
│   ├── AuthProvider.js           # NextAuth SessionProvider wrapper
│   └── Navbar.js                 # Dynamic role-aware navigation
├── lib/
│   ├── auth.js                   # Auth.js config, providers, & callbacks
│   └── db.js                     # Cached Mongoose MongoDB connection
├── models/
│   ├── Enquiry.js                # Enquiry schema & model
│   ├── Product.js                # Product schema with ownerId
│   └── User.js                   # User schema (name, email, passwordHash, role)
├── package.json
└── jsconfig.json
```

---

## ⚙️ Environment Variables

Add the following to your `.env.local` file:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/campuscart?retryWrites=true&w=majority
AUTH_SECRET=your_32_character_random_secret_here

# Optional Google OAuth:
AUTH_GOOGLE_ID=your_google_client_id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your_google_client_secret
```

### Obtaining Google OAuth Credentials (Google Cloud Console):
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project or select an existing one.
3. Navigate to **APIs & Services > Credentials**.
4. Click **Create Credentials > OAuth client ID**.
5. Application Type: **Web application**.
6. Under **Authorized redirect URIs**, add:
   - For local development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://your-domain.vercel.app/api/auth/callback/google`
7. Copy the **Client ID** and **Client Secret** into `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.

---

## 🎓 Architecture & Security (For Faculty Evaluation)

1. **Authentication Flow (Auth.js & bcrypt):**
   - Credentials provider searches the `User` collection and validates the password using `bcrypt.compare()`.
   - JWT and Session callbacks attach `user.id` and `user.role` to the encrypted JWT token.
   - Client and server access session data via `useSession()` and server `auth()`.

2. **Server-Side Authorization & Ownership:**
   - Client UI checks are only for user experience (e.g. hiding edit/delete buttons for non-owners).
   - Route Handlers (`PUT /api/products/[id]`, `DELETE /api/products/[id]`) inspect `session.user.id` against `product.ownerId` and `session.user.role === 'ADMIN'`. Unauthorized requests return `403 Forbidden`.

3. **Protection against Privilege Escalation:**
   - Registration strictly ignores any client-supplied role and enforces `role: "USER"`.
   - Admin promotions require server administrative authorization (`ADMIN_SETUP_SECRET` or existing `ADMIN` session).
