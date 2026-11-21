# CampusCart - College Second-Hand Marketplace

CampusCart is a full-stack web application designed for college students to buy and sell second-hand items within their campus community. Students can browse textbooks, electronics, cycles, and hostel essentials, post their own listings, and send direct enquiries to sellers.

---

## 🚀 Features

### 1. Marketplace
- **Browse Items:** View all items listed by students across categories.
- **Search & Filter:** Search by product title, filter by category (Textbooks, Electronics, Hostel & Room, etc.) and condition (Brand New, Like New, Good, Fair).
- **Sort Options:** Sort listings by newest, oldest, or price (low-to-high, high-to-low).
- **Status Badges:** Clearly see whether an item is Available, Reserved, or Sold.

### 2. Product Management
- **List an Item:** Add new listings with name, category, price, condition, description, image URL, and seller contact details.
- **Edit Listing:** Update pricing, description, category, and availability status.
- **Delete Listing:** Remove listings with one click.
- **Availability Toggle:** Quickly switch status between Available, Reserved, and Sold.

### 3. Seller Dashboard
- **Filter by Seller Email:** Enter your email to view only your listings.
- **Listings Overview:** Check total listings and current status at a glance.
- **Manage Enquiries:** Review buyer messages and offer prices, with buttons to Accept or Reject enquiries.

### 4. Direct Enquiries
- **Send Enquiries:** Buyers can send a message and optional offer price to the seller.
- **Status Tracking:** Sellers can update enquiry status (Pending, Accepted, Rejected).

---

## 🛠️ Technology Stack

- **Framework:** Next.js (App Router)
- **Frontend:** React with pure CSS & Responsive Flexbox/Grid
- **Backend:** Next.js API Route Handlers
- **Database:** MongoDB Atlas (Cloud Database)
- **ODM:** Mongoose
- **Deployment:** Vercel

---

## 📁 Project Structure

```text
├── app/
│   ├── api/
│   │   ├── products/
│   │   │   ├── route.js          # GET (list/filter) & POST (create)
│   │   │   └── [id]/route.js     # GET, PUT, DELETE product
│   │   ├── enquiries/
│   │   │   ├── route.js          # GET & POST enquiries
│   │   │   └── [id]/route.js     # PATCH (status) & DELETE enquiry
│   │   └── test-db/route.js      # Database health check
│   ├── dashboard/
│   │   └── page.js               # Seller dashboard & enquiry management
│   ├── products/
│   │   ├── [id]/
│   │   │   ├── page.js           # Item details & enquiry submission
│   │   │   └── edit/page.js      # Edit listing form
│   │   └── new/page.js           # New listing form
│   ├── globals.css               # Clean student-friendly CSS styling
│   ├── layout.js                 # Global navigation & footer
│   └── page.js                   # Marketplace homepage
├── lib/
│   └── db.js                     # Cached Mongoose MongoDB connection
├── models/
│   ├── Product.js                # Product schema & model
│   └── Enquiry.js                # Enquiry schema & model
├── package.json
└── jsconfig.json
```

---

## ⚙️ Getting Started Locally

### 1. Clone the repository
```bash
git clone <repository-url>
cd nextjs
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/campuscart?retryWrites=true&w=majority
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production build
```bash
npm run build
npm start
```

---

## 🎓 How the Architecture Works (For Faculty Evaluation)

1. **Frontend (Next.js App Router & React):**
   - The user interacts with React components located in the `app/` directory.
   - Pages fetch data using standard `fetch()` calls to internal API routes (`/api/products`, `/api/enquiries`).

2. **Backend (API Route Handlers):**
   - API endpoints are defined in `app/api/.../route.js`.
   - Each route validates input, calls `connectDB()`, and executes Mongoose queries.

3. **Database Layer (MongoDB Atlas & Mongoose):**
   - `lib/db.js` maintains a cached connection to MongoDB Atlas to prevent duplicate connections during serverless invocations.
   - Schemas are defined in `models/Product.js` and `models/Enquiry.js` with validations for required fields and enums.
