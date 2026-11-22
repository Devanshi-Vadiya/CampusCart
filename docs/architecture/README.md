# CampusCart: Architecture, Flowcharts & System Design Specification

Welcome to the architectural documentation for **CampusCart**, a full-stack peer-to-peer second-hand marketplace designed specifically for college campuses. CampusCart empowers students to securely buy, sell, and negotiate on pre-owned academic and hostel goods (textbooks, electronics, mobility, dorm essentials) with strict identity verification, role-based access control (RBAC), and edge-level route protection.

---

## 1. System Overview & Technology Stack

| Layer | Technology | Purpose / Architectural Role |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | Server-rendered React components, client views, and unified API route handlers |
| **Runtime & Language** | Node.js & React 19 | Modern declarative UI, hooks, and server-side streaming |
| **Authentication** | Auth.js v5 (`next-auth@beta`) | Credentials authentication, Google OAuth 2.0, encrypted JWT session tokens |
| **Security & Cryptography**| `bcryptjs` (Salt factor 10) | One-way hashing of passwords; administrative provisioning gating |
| **Database & ODM** | MongoDB Atlas & Mongoose 9 | Cloud document database with validated Schemas, enum constraints, and indexing |
| **Edge Interceptor** | Next.js Edge Middleware | Global session inspection, unauthenticated redirect handling, and URL sanitization |
| **Styling** | Tailwind CSS | Responsive, accessible UI with atomic design tokens |

---

## 2. Master Navigation & Edge Security Flowchart

The following diagram illustrates how incoming traffic is intercepted at the Next.js Edge layer. Visitors cannot reach marketplace listings, search filters, or dashboards without an active session token.

```mermaid
flowchart TD
    %% Styling Classes
    classDef visitor fill:#f8fafc,stroke:#64748b,stroke-width:2px,color:#0f172a;
    classDef middleware fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;
    classDef authPage fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d;
    classDef student fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#1e3a8a;
    classDef admin fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#4c1d95;
    classDef decision fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d;
    classDef logout fill:#f1f5f9,stroke:#94a3b8,stroke-width:2px,color:#334155;

    Start(["Visitor Opens CampusCart URL<br/>(e.g., /, /products/:id, /dashboard, /admin)"]):::visitor
    MW{"Edge Middleware<br/>(middleware.js)<br/>Session Cookie Present?"}:::middleware

    Start --> MW

    %% Unauthenticated Flow
    MW -- "No Cookie (Unauthenticated)" --> CheckAuthPath{"Requested Path is<br/>/login, /register, or /api/auth/*?"}:::decision
    CheckAuthPath -- "Yes" --> AllowAuthPage["Render Login / Register Page (200 OK)"]:::authPage
    CheckAuthPath -- "No" --> RedirectLogin["Redirect 307 to /login?callbackUrl=..."]:::decision
    RedirectLogin --> AllowAuthPage

    AllowAuthPage --> UserAction{"User Choice on<br/>Auth Screen"}:::authPage
    UserAction -- "Register" --> DoRegister["Submit Name, Email, Role, Password<br/>(/register)"]:::authPage
    UserAction -- "Login" --> DoLogin["Sign In via Credentials or Google OAuth<br/>(/login)"]:::authPage
    DoRegister --> DoLogin

    DoLogin --> AuthSuccess{"Authentication<br/>Successful?"}:::decision
    AuthSuccess -- "No" --> ShowErr["Display Validation / Error Message"]:::decision
    ShowErr --> AllowAuthPage
    AuthSuccess -- "Yes" --> IssueToken["Issue Encrypted JWT Session Token<br/>Attach authjs.session-token Cookie"]:::authPage

    %% Authenticated Flow
    IssueToken --> RedirectBack["Redirect to callbackUrl<br/>(or Default /)"]:::middleware
    RedirectBack --> MW

    MW -- "Has Valid Session Cookie" --> CheckAuthVisitingPage{"Visiting /login or /register?"}:::decision
    CheckAuthVisitingPage -- "Yes" --> RedirectHome["Redirect to Marketplace (/)"]:::middleware

    CheckAuthVisitingPage -- "No" --> RouteTarget{"Target Route"}:::decision

    %% Routes
    RouteTarget -- "/ or /products/:id" --> MktView["Browse Campus Marketplace<br/>Search, Filter, View Item Details"]:::student
    RouteTarget -- "/products/new" --> CreateView["Post New Second-Hand Listing<br/>(Attaches Owner ID from Session)"]:::student
    RouteTarget -- "/dashboard" --> DashCheck{"Check User Role in Session"}:::decision
    DashCheck -- "USER or ADMIN" --> StudentDash["Student Dashboard<br/>My Listings & Incoming Enquiries"]:::student

    RouteTarget -- "/admin" --> AdminRoleCheck{"Check User Role in Session"}:::decision
    AdminRoleCheck -- "role == 'ADMIN'" --> AdminDash["Admin Dashboard (200 OK)<br/>Manage All Students' Listings"]:::admin
    AdminRoleCheck -- "role == 'USER'" --> AdminDenied["403 Access Denied View<br/>Student Redirected / Blocked"]:::decision

    %% Logout
    MktView -.-> LogoutBtn["Click 'Log Out' in Navbar"]:::logout
    StudentDash -.-> LogoutBtn
    AdminDash -.-> LogoutBtn
    LogoutBtn --> EndSession["signOut({ callbackUrl: '/' })<br/>Clear Session Cookie"]:::logout
    EndSession --> MW
```

### Key Architectural Highlights:
1. **Zero Unauthenticated Leaks:** Every request passing into Next.js routes is intercepted in `middleware.js`. Unauthenticated attempts to access `/`, `/products/*`, `/dashboard`, or `/admin` trigger a HTTP 307 redirect with a preserved `callbackUrl`.
2. **Infinite Loop Prevention:** Paths starting with `/login`, `/register`, `/api/auth/`, and static assets (`/_next/static`, `/_next/image`, `favicon.ico`) bypass redirection.
3. **Session Re-entry Guard:** If an already authenticated student opens `/login` or `/register`, the Edge Middleware immediately forwards them to `/` to avoid redundant logins.

---

## 3. Authentication Engine (Dual Provider Architecture)

CampusCart supports two sign-in methods: **Credentials (Email/Password)** and **Google OAuth 2.0**. Administrative creation is guarded by a cryptographic administrative secret key.

```mermaid
flowchart TD
    %% Styling Classes
    classDef client fill:#f8fafc,stroke:#64748b,stroke-width:2px,color:#0f172a;
    classDef auth fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d;
    classDef db fill:#ffedd5,stroke:#ea580c,stroke-width:2px,color:#7c2d12;
    classDef security fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d;
    classDef oauth fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#1e3a8a;

    subgraph RegistrationFlow ["1. User Registration (/register & /api/auth/register)"]
        R1["Visitor Fills Registration Form<br/>Name, Email, Password, ConfirmPassword, Role"]:::client
        R2{"Validation Check<br/>Fields filled & Passwords match & Length >= 6?"}:::security
        R1 --> R2
        R2 -- "Invalid" --> R_Err["Return 400 Bad Request<br/>Display Form Error"]:::security

        R2 -- "Valid" --> R3{"Selected Role == 'ADMIN'?"}:::security
        R3 -- "Yes" --> R4{"adminSecret ==<br/>ADMIN_SETUP_SECRET?"}:::security
        R4 -- "Mismatch" --> R_SecErr["Return 403 Forbidden<br/>Admin provisioning restricted"]:::security
        R4 -- "Match" --> R_AdminOk["Assigned Role = 'ADMIN'"]:::auth
        R3 -- "No (USER)" --> R_UserOk["Assigned Role = 'USER'"]:::auth

        R_AdminOk --> R5
        R_UserOk --> R5
        R5["Check Duplicate Email in MongoDB<br/>User.findOne({ email })"]:::db
        R5 --> R6{"Email Exists?"}:::security
        R6 -- "Yes" --> R_Dup["Return 409 Conflict<br/>Account already exists"]:::security
        R6 -- "No" --> R7["Hash Password with bcryptjs<br/>bcrypt.hash(password, 10)"]:::auth
        R7 --> R8["Save to MongoDB Collection 'users'<br/>User.create({ name, email, passwordHash, role })"]:::db
        R8 --> R9["Return 201 Created<br/>Redirect to /login"]:::client
    end

    subgraph CredentialsFlow ["2. Credentials Authentication (Email & Password)"]
        C1["User Submits Credentials on /login<br/>signIn('credentials', { email, password })"]:::client
        C1 --> C2["Auth.js Credentials Provider<br/>authorize(credentials)"]:::auth
        C2 --> C3["MongoDB Lookup<br/>User.findOne({ email })"]:::db
        C3 --> C4{"User Exists &<br/>Has passwordHash?"}:::security
        C4 -- "No" --> C_Fail["Throw Error: 'Invalid email or password'"]:::security
        C4 -- "Yes" --> C5["Verify Password<br/>bcrypt.compare(password, user.passwordHash)"]:::auth
        C5 --> C6{"Hash Matches?"}:::security
        C6 -- "No" --> C_Fail
        C6 -- "Yes" --> C7["Return User Object<br/>{ id, name, email, role, image }"]:::auth
    end

    subgraph GoogleOAuthFlow ["3. Google OAuth 2.0 Authentication"]
        G1["User Clicks 'Continue with Google'<br/>signIn('google')"]:::oauth
        G1 --> G2["Redirect to Google Accounts Consent Screen"]:::oauth
        G2 --> G3["Google Verifies & Redirects to Callback<br/>/api/auth/callback/google"]:::oauth
        G3 --> G4["Auth.js signIn Callback<br/>signIn({ user, account })"]:::auth
        G4 --> G5["MongoDB Lookup: User.findOne({ email })"]:::db
        G5 --> G6{"User Already in DB?"}:::security
        G6 -- "No" --> G7["Create New User in MongoDB<br/>User.create({ name, email, role: 'USER', image })"]:::db
        G6 -- "Yes" --> G8["Retrieve Existing User Role & ID"]:::db
        G7 --> G9["Attach MongoDB _id and role to User"]:::auth
        G8 --> G9
    end

    subgraph SessionHandling ["4. JWT & Session Token Pipeline"]
        C7 --> JWT["jwt Callback<br/>token.id = user.id<br/>token.role = user.role"]:::auth
        G9 --> JWT
        JWT --> SESS["session Callback<br/>session.user.id = token.id<br/>session.user.role = token.role"]:::auth
        SESS --> COOKIE["Encrypt JWT & Set HTTP-Only Cookie<br/>authjs.session-token"]:::auth
        COOKIE --> REDIR["Redirect to Destination Page<br/>(callbackUrl or /)"]:::client
    end

    subgraph LogoutPipeline ["5. Sign-Out / Session Termination"]
        L1["User Clicks 'Log Out' in Navbar"]:::client
        L1 --> L2["Auth.js signOut({ callbackUrl: '/' })"]:::auth
        L2 --> L3["Clear authjs.session-token Cookie<br/>Invalidate JWT Session"]:::auth
        L3 --> L4["Edge Middleware Detects No Cookie<br/>Redirects to /login"]:::client
    end
```

### Key Security Safeguards:
- **Restricted Admin Provisioning:** The public registration form allows users to select `Role: ADMIN`, but the server validates `adminSecret === process.env.ADMIN_SETUP_SECRET`. Any unauthorized submission immediately receives an HTTP `403 Forbidden` response.
- **Bcrypt Salt Rounds:** All passwords are run through `bcryptjs` with 10 salt rounds before persistence. Plaintext passwords are never logged, stored, or exposed.
- **JWT Enrichment:** In `lib/auth.js`, the `jwt` and `session` callbacks explicitly preserve `user.id` and `user.role`, ensuring client and server components have access to authorization data without re-querying the database on every micro-interaction.

---

## 4. Role-Based Access Control (RBAC) & Authorization Logic

Authorization rules are enforced **both at the UI level (conditional element rendering) and strictly on the server (API route handlers)**.

```mermaid
flowchart TD
    %% Styling Classes
    classDef req fill:#f8fafc,stroke:#64748b,stroke-width:2px,color:#0f172a;
    classDef authCheck fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;
    classDef student fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#1e3a8a;
    classDef admin fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#4c1d95;
    classDef ok fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d;
    classDef deny fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d;

    Req["Client / User Action Request<br/>(API Call or Page Navigation)"]:::req
    AuthCheck{"1. Is User Authenticated?<br/>(Valid Session in Auth.js)"}:::authCheck

    Req --> AuthCheck
    AuthCheck -- "No" --> Unauth["Return 401 Unauthorized /<br/>Redirect to /login"]:::deny

    AuthCheck -- "Yes" --> ActionType{"2. What Action is<br/>Requested?"}:::authCheck

    %% Read Operations
    ActionType -- "Browse / Search Listings<br/>GET /api/products" --> ReadOk["200 OK: Return Filtered Listings"]:::ok
    ActionType -- "View Listing Details<br/>GET /api/products/:id" --> ReadDetailOk["200 OK: Return Product Details"]:::ok
    ActionType -- "Send Product Enquiry<br/>POST /api/enquiries" --> SendEnq["200 OK: Create Enquiry in MongoDB<br/>(Buyer Name & Email linked)"]:::ok

    %% Create Listing
    ActionType -- "Create New Listing<br/>POST /api/products" --> CreateCheck["Bind Authenticated Identity:<br/>ownerId = session.user.id<br/>sellerEmail = session.user.email"]:::student
    CreateCheck --> SaveProduct["201 Created: Saved to MongoDB"]:::ok

    %% Access Dashboard
    ActionType -- "Access Student Dashboard<br/>/dashboard" --> CheckStudentDash["Verify Session: role == 'USER' or 'ADMIN'"]:::student
    CheckStudentDash --> ServeStudentDash["200 OK: Load Student Profile,<br/>My Listings (scoped by ownerId),<br/>and Incoming Enquiries"]:::ok

    %% Access Admin Dashboard
    ActionType -- "Access Admin Dashboard<br/>/admin" --> CheckAdminPage{"Check Role in Session:<br/>session.user.role == 'ADMIN'?"}:::authCheck
    CheckAdminPage -- "Yes" --> ServeAdminDash["200 OK: Load Admin Dashboard<br/>All Listings, Full Moderation Controls"]:::admin
    CheckAdminPage -- "No (USER)" --> DenyAdminDash["403 Access Denied View<br/>'Restricted to administrators only'"]:::deny

    %% Modify / Delete Listing
    ActionType -- "Edit, Status Change, Delete Listing<br/>PUT / DELETE /api/products/:id" --> FetchItem["Fetch Listing from MongoDB<br/>Product.findById(id)"]:::authCheck
    FetchItem --> ItemFound{"Item Exists?"}:::authCheck
    ItemFound -- "No" --> NotFound["404 Not Found"]:::deny

    ItemFound -- "Yes" --> CheckOwnership{"Server-Side Authorization Check:<br/>session.user.role == 'ADMIN'<br/>OR<br/>product.ownerId == session.user.id?"}:::authCheck

    CheckOwnership -- "Yes (Admin or Owner)" --> ExecuteUpdate["Allow Operation:<br/>Update Status / Details / Delete Record"]:::ok
    CheckOwnership -- "No (Different Student)" --> DenyUpdate["403 Forbidden Response<br/>'Forbidden: You are not authorized'"]:::deny

    %% Manage Enquiries
    ActionType -- "Update / Delete Enquiry<br/>PATCH / DELETE /api/enquiries/:id" --> CheckEnqAuth{"session.user.role == 'ADMIN'<br/>OR<br/>enquiry.sellerEmail == session.user.email?"}:::authCheck
    CheckEnqAuth -- "Yes" --> AllowEnqChange["Update Status (Accepted/Rejected) / Delete"]:::ok
    CheckEnqAuth -- "No" --> DenyEnqChange["403 Forbidden Response"]:::deny
```

### RBAC Permission Matrix:
| Capability / Route | Unauthenticated | Student (`USER`) | Administrator (`ADMIN`) | Enforcement Layer |
| :--- | :---: | :---: | :---: | :--- |
| **View Marketplace (`/`)** | Redirect 307 | Allowed | Allowed | Edge Middleware |
| **View Item Details (`/products/:id`)** | Redirect 307 | Allowed | Allowed | Edge Middleware |
| **Create Listing (`POST /api/products`)** | 401 | Allowed (`ownerId` bound) | Allowed (`ownerId` bound) | API Handler |
| **Edit/Delete Own Listing** | 401 | Allowed | Allowed | API Handler & UI |
| **Edit/Delete Another's Listing** | 401 | **403 Forbidden** | Allowed (Moderation) | API Handler & UI |
| **Send Enquiry on Item** | 401 | Allowed (Buyer) | Allowed (Buyer) | API Handler & UI |
| **Manage Received Enquiries** | 401 | Allowed (Seller Only) | Allowed (Admin Override)| API Handler & UI |
| **Access Admin Panel (`/admin`)** | Redirect 307 | **403 Forbidden** | Allowed | Middleware & UI Guard |

---

## 5. Listing Lifecycle & Cascading Deletion Flowchart

A product in CampusCart progresses through three primary states: **Available**, **Reserved**, and **Sold**. When an item is deleted, the database automatically cascades deletions to avoid orphan enquiry records.

```mermaid
flowchart TD
    %% Styling Classes
    classDef client fill:#f8fafc,stroke:#64748b,stroke-width:2px,color:#0f172a;
    classDef api fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;
    classDef db fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#4c1d95;
    classDef decision fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d;
    classDef statusAvail fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d;
    classDef statusRes fill:#fef9c3,stroke:#ca8a04,stroke-width:2px,color:#713f12;
    classDef statusSold fill:#f1f5f9,stroke:#94a3b8,stroke-width:2px,color:#334155;
    classDef cascade fill:#ffe4e6,stroke:#e11d48,stroke-width:2px,color:#881337;

    %% Stage 1: Creation
    subgraph S1 ["1. Listing Creation (/products/new)"]
        CreatePage["Student Fills Form<br/>(Title, Desc, Price, Category, Condition, Image)"]:::client
        SubmitCreate["POST /api/products"]:::api
        AuthCreate{"Check Active Session<br/>session.user.id?"}:::decision
        InjectOwner["Inject Owner Details:<br/>ownerId = session.user.id<br/>sellerName = session.user.name<br/>sellerEmail = session.user.email<br/>status = 'Available'"]:::api
        SaveProduct[("MongoDB Atlas:<br/>Insert Product Document")]:::db

        CreatePage --> SubmitCreate
        SubmitCreate --> AuthCreate
        AuthCreate -- "No Session (401)" --> DenyCreate["401 Unauthorized"]:::decision
        AuthCreate -- "Valid Session" --> InjectOwner
        InjectOwner --> SaveProduct
    end

    %% Stage 2: Discovery & Viewing
    subgraph S2 ["2. Discovery & Role-Aware Details (/products/:id)"]
        SaveProduct --> ViewList["Marketplace Feed (/)<br/>GET /api/products with Filters"]:::client
        ViewList --> ViewDetail["Student / Admin Clicks Product<br/>Route: /products/:id"]:::client
        FetchDetail["GET /api/products/:id"]:::api
        ViewDetail --> FetchDetail

        CheckOwnership{"Role & Ownership Check<br/>isOwner = (ownerId == session.id)<br/>isAdmin = (role == 'ADMIN')"}:::decision
        FetchDetail --> CheckOwnership

        %% Buyer Perspective
        CheckOwnership -- "Neither Owner nor Admin (Buyer)" --> BuyerView["Buyer UI Mode:<br/>- View Details, Condition, Price<br/>- Seller Contact Info<br/>- Make Offer / Send Enquiry Form"]:::client
        SendEnq["Submit Enquiry<br/>POST /api/enquiries<br/>(productId, offerPrice, message)"]:::api
        BuyerView --> SendEnq
        SaveEnq[("MongoDB Atlas:<br/>Insert Enquiry Record<br/>status: 'Pending'")]:::db
        SendEnq --> SaveEnq

        %% Owner / Admin Perspective
        CheckOwnership -- "isOwner OR isAdmin" --> OwnerView["Manager UI Mode:<br/>- Quick Status Toggle Buttons<br/>- Edit Listing Button<br/>- Delete Listing Button"]:::client
    end

    %% Stage 3: Status Lifecycle & Updates
    subgraph S3 ["3. Status Lifecycle State Machine"]
        OwnerView --> StatusToggle["Trigger Status Change<br/>PUT /api/products/:id<br/>body: { status }"]:::api
        
        StateAvailable(["Status: Available<br/>(Listed on Feed)"]):::statusAvail
        StateReserved(["Status: Reserved<br/>(Deal in Progress)"]):::statusRes
        StateSold(["Status: Sold<br/>(Archived / Completed)"]):::statusSold

        StatusToggle --> StateTransition{"Target Status"}:::decision
        StateTransition -- "Reserve" --> StateReserved
        StateTransition -- "Mark Sold" --> StateSold
        StateTransition -- "Reactivate" --> StateAvailable
        
        StateReserved -.-> StateSold
        StateReserved -.-> StateAvailable
        StateSold -.-> StateAvailable

        UpdateDB[("MongoDB Atlas:<br/>Product.findByIdAndUpdate")]:::db
        StateAvailable --> UpdateDB
        StateReserved --> UpdateDB
        StateSold --> UpdateDB
    end

    %% Stage 4: Edit & Cascading Deletion
    subgraph S4 ["4. Modification & Deletion Cascade"]
        OwnerView --> EditAction["Click Edit Listing<br/>Route: /products/:id/edit"]:::client
        EditAction --> SubmitEdit["PUT /api/products/:id<br/>Update Fields & Price"]:::api
        SubmitEdit --> CheckEditAuth{"Verify Owner/Admin"}:::decision
        CheckEditAuth -- "Allowed" --> UpdateDB
        CheckEditAuth -- "Forbidden" --> DenyEdit["403 Forbidden"]:::decision

        OwnerView --> DeleteAction["Click Delete Listing<br/>Confirmation Prompt"]:::client
        DeleteAction --> SubmitDelete["DELETE /api/products/:id"]:::api
        SubmitDelete --> CheckDeleteAuth{"Verify Owner/Admin"}:::decision
        CheckDeleteAuth -- "Allowed" --> CascadeExec["1. Product.findByIdAndDelete(id)<br/>2. Enquiry.deleteMany({ productId: id })"]:::cascade
        CheckDeleteAuth -- "Forbidden" --> DenyDelete["403 Forbidden"]:::decision
        CascadeExec --> DBDeleted[("MongoDB Atlas:<br/>Product & Associated Enquiries<br/>Permanently Purged")]:::db
    end
```

---

## 6. Dual Dashboards: Student Portal vs Admin Console

CampusCart features two dedicated management interfaces tailored to user roles.

```mermaid
flowchart TD
    %% Styling Classes
    classDef student fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#1e3a8a;
    classDef admin fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#4c1d95;
    classDef api fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;
    classDef db fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#14532d;
    classDef guard fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d;
    classDef action fill:#f8fafc,stroke:#64748b,stroke-width:2px,color:#0f172a;

    UserEntry(["User Enters Dashboard URL"]):::action

    %% Guard Branch
    UserEntry --> URLCheck{"Requested URL"}:::guard

    %% STUDENT DASHBOARD (/dashboard)
    URLCheck -- "/dashboard" --> StudentAuthCheck{"Session Status?<br/>(Edge & Client-Side)"}:::guard
    StudentAuthCheck -- "Unauthenticated" --> RedirectLogin["Redirect 307 to /login"]:::guard
    StudentAuthCheck -- "Authenticated (USER or ADMIN)" --> LoadStudentDash["Render Student Dashboard (/dashboard)"]:::student

    LoadStudentDash --> StudentFetch["Parallel Fetch:<br/>1. GET /api/products?ownerId=session.user.id<br/>2. GET /api/enquiries"]:::api

    StudentFetch --> FilterScope[("MongoDB Scoped Queries:<br/>Products where ownerId == user.id<br/>Enquiries where sellerEmail == user.email")]:::db

    FilterScope --> StudentTabs{"Active Tab in Dashboard"}:::student

    %% Tab 1: My Listings
    StudentTabs -- "Tab: My Listings" --> MyListingsView["Display User's Listed Products<br/>- Image, Price, Category, Status Badge"]:::student
    MyListingsView --> ListingActions{"User Action on Listing"}:::action
    
    ListingActions -- "Change Status" --> SChangeStatus["PUT /api/products/:id<br/>body: { status: 'Available' | 'Reserved' | 'Sold' }"]:::api
    ListingActions -- "Edit Item" --> SEdit["Navigate to /products/:id/edit"]:::action
    ListingActions -- "Delete Item" --> SDelete["DELETE /api/products/:id<br/>(Purges product + enquiries)"]:::api

    %% Tab 2: Enquiries
    StudentTabs -- "Tab: Received Enquiries" --> EnquiriesView["Display Enquiries from Potential Buyers<br/>- Product Name, Buyer Name & Email<br/>- Message & Offer Price<br/>- Status Badge (Pending / Accepted / Rejected)"]:::student
    EnquiriesView --> EnqActions{"Seller Action on Enquiry"}:::action
    EnqActions -- "Accept Offer" --> AcceptEnq["PATCH /api/enquiries/:id<br/>body: { status: 'Accepted' }"]:::api
    EnqActions -- "Reject Offer" --> RejectEnq["PATCH /api/enquiries/:id<br/>body: { status: 'Rejected' }"]:::api

    %% ADMIN DASHBOARD (/admin)
    URLCheck -- "/admin" --> AdminAuthCheck{"Session Status & Role?<br/>session.user.role == 'ADMIN'"}:::guard
    AdminAuthCheck -- "Unauthenticated" --> RedirectLogin
    AdminAuthCheck -- "Role is 'USER' (Student)" --> AdminAccessDenied["Display Access Denied Notice<br/>Forbidden 403 / Redirect"]:::guard
    AdminAuthCheck -- "Role is 'ADMIN'" --> LoadAdminDash["Render Admin Dashboard (/admin)"]:::admin

    LoadAdminDash --> AdminControls["Admin Global Controls:<br/>- Search by Keyword<br/>- Filter by Category<br/>- Filter by Status (All / Available / Reserved / Sold)"]:::admin

    AdminControls --> AdminFetch["Fetch All System Listings:<br/>GET /api/products?search=...&category=...&status=..."]:::api

    AdminFetch --> AdminDB[("MongoDB Atlas Query:<br/>Product.find(globalFilters)<br/>(Unrestricted by ownerId)")]:::db

    AdminDB --> AdminListingsTable["Render Global Management Table<br/>- All Products from All Students<br/>- Owner Name & Email<br/>- Current Status & Price"]:::admin

    AdminListingsTable --> AdminModeration{"Admin Moderation Action"}:::action
    AdminModeration -- "Moderate / Change Status" --> AChangeStatus["PUT /api/products/:id<br/>Force Status to Available / Reserved / Sold"]:::api
    AdminModeration -- "Remove Listing" --> ADelete["DELETE /api/products/:id<br/>Permanently Delete Listing & Cascaded Enquiries"]:::api
    AdminModeration -- "Inspect Item" --> AView["Navigate to /products/:id"]:::action
```

---

## 7. Complete System Route Tree & Interactivity Map

The following map captures all App Router pages, REST API route handlers, Edge Middleware guards, and MongoDB Atlas database collections.

```mermaid
flowchart LR
    %% Styling Classes
    classDef edge fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;
    classDef publicRoute fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d;
    classDef studentRoute fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#1e3a8a;
    classDef adminRoute fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#4c1d95;
    classDef apiRoute fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#0f172a;
    classDef db fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#14532d;

    %% Root
    Root["Client Request / Browser Navigation"]:::publicRoute

    %% Middleware Layer
    subgraph MW ["Edge Middleware Layer (middleware.js)"]
        EdgeGuard["Edge Session Validator<br/>Reads authjs.session-token Cookie<br/>Intercepts All Non-Asset Requests"]:::edge
    end

    Root --> EdgeGuard

    %% Public & Auth Routes
    subgraph AuthArea ["Public & Authentication Endpoints"]
        R_Login["/login (Sign In Page)"]:::publicRoute
        R_Register["/register (Registration Page)"]:::publicRoute
        API_Auth["/api/auth/[...nextauth]<br/>- GET/POST Sign In / Callback<br/>- POST Sign Out<br/>- GET Session & CSRF"]:::apiRoute
        API_Reg["POST /api/auth/register<br/>- Public student registration<br/>- Secure admin registration with secret"]:::apiRoute
    end

    %% Protected Marketplace UI Routes
    subgraph MarketUI ["Protected Marketplace Pages (USER & ADMIN)"]
        R_Home["/ (Home & Marketplace Feed)<br/>- Search, Category Filter, Sort"]:::studentRoute
        R_ProdDetail["/products/:id (Product Details)<br/>- Buyer: Enquiry form<br/>- Owner/Admin: Management controls"]:::studentRoute
        R_ProdNew["/products/new (Create Listing)<br/>- Create second-hand product"]:::studentRoute
        R_ProdEdit["/products/:id/edit (Edit Listing)<br/>- Modify title, price, details"]:::studentRoute
        R_StudentDash["/dashboard (Student Dashboard)<br/>- My Listings & Received Enquiries"]:::studentRoute
    end

    %% Protected Admin UI Routes
    subgraph AdminUI ["Protected Admin Dashboard (ADMIN Only)"]
        R_Admin["/admin (Admin Management Console)<br/>- Full campus catalog oversight<br/>- Status override & moderation delete"]:::adminRoute
    end

    %% Protected API Endpoints
    subgraph API_Endpoints ["REST API Handlers (App Router)"]
        API_Products["/api/products<br/>- GET: List items (with query filters)<br/>- POST: Create listing (ownerId attached)"]:::apiRoute
        API_ProductItem["/api/products/:id<br/>- GET: Single item lookup<br/>- PUT: Update item / change status<br/>- DELETE: Cascade delete item & enquiries"]:::apiRoute
        API_Enquiries["/api/enquiries<br/>- GET: Fetch seller's received enquiries<br/>- POST: Submit buyer enquiry"]:::apiRoute
        API_EnquiryItem["/api/enquiries/:id<br/>- PATCH: Update status (Accept/Reject)"]:::apiRoute
        API_Promote["POST /api/admin/promote<br/>- Promote existing user to ADMIN role"]:::apiRoute
        API_TestDB["GET /api/test-db<br/>- Health check & Atlas ping"]:::apiRoute
    end

    %% Database
    subgraph DBCluster ["MongoDB Atlas Database"]
        M_User[("Users Collection")]:::db
        M_Product[("Products Collection")]:::db
        M_Enquiry[("Enquiries Collection")]:::db
    end

    %% Routing Flow Connections
    EdgeGuard -- "Unauthenticated & Auth Path" --> AuthArea
    EdgeGuard -- "Unauthenticated & Protected Path" --> Redirect307["307 Redirect to /login?callbackUrl=..."]:::edge
    EdgeGuard -- "Authenticated" --> MarketUI
    EdgeGuard -- "Authenticated (Admin Role)" --> AdminUI
    EdgeGuard -- "API Request" --> API_Endpoints

    %% Page to API Interactivity
    R_Home --> API_Products
    R_ProdDetail --> API_ProductItem
    R_ProdDetail --> API_Enquiries
    R_ProdNew --> API_Products
    R_ProdEdit --> API_ProductItem
    R_StudentDash --> API_Products
    R_StudentDash --> API_Enquiries
    R_StudentDash --> API_EnquiryItem
    R_Admin --> API_Products
    R_Admin --> API_ProductItem

    %% API to Database
    API_Auth --> M_User
    API_Reg --> M_User
    API_Promote --> M_User
    API_Products --> M_Product
    API_ProductItem --> M_Product
    API_ProductItem -. "Cascade Delete" .-> M_Enquiry
    API_Enquiries --> M_Enquiry
    API_EnquiryItem --> M_Enquiry
```

---

## 8. Database Entity-Relationship (ER) Model

The database is structured in MongoDB Atlas using Mongoose ODM with relational references (`ObjectId` / `ref`) and timestamps.

```mermaid
erDiagram
    %% CampusCart Database Entity-Relationship Diagram

    USER ||--o{ PRODUCT : "creates / owns"
    PRODUCT ||--o{ ENQUIRY : "receives"
    USER ||--o{ ENQUIRY : "participates (buyer / seller)"

    USER {
        ObjectId _id PK "Unique identifier"
        string name "User full name"
        string email UK "Unique lowercase email address"
        string passwordHash "Bcrypt hashed password (null for OAuth)"
        string role "Role enum: USER | ADMIN (default: USER)"
        string image "Profile avatar image URL"
        date createdAt "Automatic creation timestamp"
        date updatedAt "Automatic modification timestamp"
    }

    PRODUCT {
        ObjectId _id PK "Unique product identifier"
        string name "Item title / name"
        string description "Detailed item condition & specs"
        number price "Listing price in INR (min: 0)"
        string category "Enum: Textbooks, Electronics, Stationery, Hostel & Room, Cycles & Mobility, Clothing, Other"
        string condition "Enum: Brand New, Like New, Good, Fair"
        string image "Product image URL"
        ObjectId ownerId FK "Reference to USER._id"
        string sellerName "Denormalized seller name"
        string sellerEmail "Denormalized lowercase seller email"
        string status "Enum: Available, Reserved, Sold (default: Available)"
        date createdAt "Automatic creation timestamp"
        date updatedAt "Automatic modification timestamp"
    }

    ENQUIRY {
        ObjectId _id PK "Unique enquiry identifier"
        ObjectId productId FK "Reference to PRODUCT._id"
        string productName "Denormalized product name"
        string sellerEmail "Lowercase seller contact email"
        string buyerName "Potential buyer full name"
        string buyerEmail "Lowercase buyer contact email"
        string message "Buyer enquiry message or question"
        number offerPrice "Optional counter-offer price in INR (min: 0)"
        string status "Enum: Pending, Accepted, Rejected (default: Pending)"
        date createdAt "Automatic creation timestamp"
        date updatedAt "Automatic modification timestamp"
    }
```

---

## 9. Comprehensive Route & API Matrix

| Route / Endpoint | HTTP Method | Accessibility | Auth Layer | Request Payload / Params | Return Data / Status |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `/login` | `GET` | Public | Edge Bypass | `?callbackUrl=...` | Render Sign-In Form (200) |
| `/register` | `GET` | Public | Edge Bypass | None | Render Register Form (200) |
| `/` | `GET` | Protected | Edge Middleware | Search/Filter query params | Render Marketplace Feed (200) |
| `/products/[id]` | `GET` | Protected | Edge Middleware | `id` route parameter | Render Product Details (200) |
| `/products/new` | `GET` | Protected | Edge Middleware | None | Render Create Listing Form (200) |
| `/products/[id]/edit` | `GET` | Protected | Edge Middleware | `id` route parameter | Render Edit Listing Form (200) |
| `/dashboard` | `GET` | Protected | Edge Middleware | None | Render Student Dashboard (200) |
| `/admin` | `GET` | ADMIN Only | Edge & Client Guard | None | Render Admin Console (200) / 403 |
| `/api/auth/[...nextauth]` | `GET/POST`| Public | Auth.js Handler | Credentials or OAuth payload | OAuth redirects, Session JWT |
| `/api/auth/register` | `POST` | Public | Salt & Secret Guard | `{ name, email, password, role, adminSecret }` | `{ success: true, user }` (201) |
| `/api/admin/promote` | `POST` | Protected | Secret Guard | `{ email, adminSecret }` | `{ success: true, user }` (200) |
| `/api/products` | `GET` | Protected | Session Check | `?search=&category=&minPrice=&maxPrice=&sortBy=&status=&ownerId=` | `{ success: true, products: [...] }` (200) |
| `/api/products` | `POST` | Protected | Session Check | `{ name, description, price, category, condition, image }` | `{ success: true, product }` (201) |
| `/api/products/[id]` | `GET` | Protected | Session Check | `id` route parameter | `{ success: true, product }` (200) |
| `/api/products/[id]` | `PUT` | Protected | Owner/ADMIN Guard | Allowed updates: `{ name, price, description, category, condition, image, status }` | `{ success: true, product }` (200) / 403 |
| `/api/products/[id]` | `DELETE` | Protected | Owner/ADMIN Guard | `id` route parameter | Cascade delete: Product & Enquiries (200) / 403 |
| `/api/enquiries` | `GET` | Protected | Session Check | Scoped to `session.user.email` | `{ success: true, enquiries: [...] }` (200) |
| `/api/enquiries` | `POST` | Protected | Session Check | `{ productId, productName, sellerEmail, message, offerPrice }` | `{ success: true, enquiry }` (201) |
| `/api/enquiries/[id]` | `PATCH` | Protected | Seller/ADMIN Guard| `{ status: 'Accepted' \| 'Rejected' }` | `{ success: true, enquiry }` (200) / 403 |

---

## 10. Evaluation & Viva Defense Guide

Use this section to prepare for questions from professors, lab evaluators, and project review panels:

### Q1: How did you implement global site protection without creating an infinite redirect loop on `/login`?
> **Answer:** We implemented Next.js Edge Middleware (`middleware.js`). The middleware checks for session cookies (`authjs.session-token` or `__Secure-authjs.session-token`). An exclusion list checks if `pathname` starts with `/login`, `/register`, or `/api/auth/`. If an unauthenticated user hits any other URL, the middleware halts execution and issues an HTTP `307 Temporary Redirect` to `/login?callbackUrl=<target>`. Because `/login` and `/register` are in the exclusion list, the browser lands on the auth screen without looping.

### Q2: What prevents a regular student from intercepting a network call and promoting themselves to ADMIN?
> **Answer:** Admin provisioning is enforced exclusively server-side in `app/api/auth/register/route.js` and `app/api/admin/promote/route.js`. The server demands a secret token (`adminSecret`) that must match `ADMIN_SETUP_SECRET` in environment variables. If a student tries to send `{ role: 'ADMIN' }` without the secret, the request is rejected with HTTP `403 Forbidden` and the account is either blocked or defaulted to `USER`.

### Q3: How do you prevent student A from modifying or deleting student B's listings via Postman or curl?
> **Answer:** Authorization does not rely on the client UI alone. In `app/api/products/[id]/route.js`, the `PUT` and `DELETE` handlers decrypt the incoming session cookie via `await auth()`. Before performing any mutation, the database retrieves the product document and evaluates:
> ```js
> const isOwner = (product.ownerId && product.ownerId.toString() === session.user.id) ||
>                 product.sellerEmail === session.user.email;
> const isAdmin = session.user.role === "ADMIN";
> if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
> ```
> This guarantees that even if a student spoofs an API call with another student's product ID, the server rejects it with an HTTP 403.

### Q4: Why is there no database seeding script or hardcoded mock data?
> **Answer:** CampusCart strictly conforms to real-world cloud practices. Instead of using artificial seed files that contaminate databases, all initial testing data is created through the production API and user interface. All records are persisted to MongoDB Atlas and handled dynamically with empty state messaging (`"No products available yet"`).

### Q5: How is referential integrity maintained when a seller deletes a product that has active buyer enquiries?
> **Answer:** In `app/api/products/[id]/route.js`, the `DELETE` handler executes a transactional cascading deletion:
> ```js
> await Product.findByIdAndDelete(id);
> await Enquiry.deleteMany({ productId: id });
> ```
> This immediately purges all orphan messages and negotiations from the database, preventing stale enquiries from appearing in student or admin dashboards.

---

## 11. Production Verification

The complete codebase is deployed and synchronized:
- **GitHub Repository:** [CampusCart on GitHub](https://github.com/Devanshi-Vadiya/CampusCart)
- **Live Production URL:** [CampusCart on Vercel](https://nextjs-ivory-nine-39.vercel.app/)
