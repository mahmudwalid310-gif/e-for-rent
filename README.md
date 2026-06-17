# 🏠 E-FOR-RENT

> বাংলাদেশের সেরা অনলাইন বাসা ভাড়ার প্ল্যাটফর্ম  
> Bangladesh's modern house rental platform — find Family, Male & Female Bachelor rentals easily.

![License](https://img.shields.io/badge/license-ISC-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![Tests](https://img.shields.io/badge/tests-28%20passing-brightgreen)

---

## ✨ Features | বৈশিষ্ট্যসমূহ

- 🔐 **Secure Auth** — JWT + bcrypt password hashing
- 🏠 **Property Listings** — Post, filter & browse ads by area, category, price
- 💳 **Bill Payment** — bKash/Nagad simulation with receipt generation
- 📸 **Photo Upload** — Multer-based image storage
- ⚙️ **Admin Panel** — Approve listings, view dashboard stats
- ✅ **28 Automated Tests** — Full Jest + Supertest suite

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, TailwindCSS, Vanilla JS |
| Backend | Node.js, Express.js |
| Database | LowDB (JSON flat-file) |
| Auth | JWT, bcryptjs |
| File Upload | Multer |
| Testing | Jest, Supertest |

---

## 🚀 Getting Started | শুরু করুন

### 1. Clone the repository
```bash
git clone https://github.com/mahmudwalid310-gif/e-for-rent.git
cd e-for-rent
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
```bash
# Copy the example file
copy .env.example .env
# Edit .env and set your JWT_SECRET
```

### 4. Seed demo data (optional)
```bash
npm run seed
```

### 5. Start the server
```bash
npm run dev        # Development (auto-restart)
npm start          # Production
```

### 6. Open in browser
```
http://localhost:5000
```

---

## 🔑 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@eforrent.com | admin123 |
| Landlord | ahsan@example.com | landlord123 |
| User | fariha@example.com | user123 |

---

## 📁 Project Structure

```
e-for-rent/
├── server.js          # Entry point
├── server_app.js      # Express app
├── app.js             # Frontend JS
├── index.html         # Homepage
├── admin.html         # Admin panel
├── add-property.html  # Post an ad
├── details.html       # Property details
├── receipt.html       # Payment receipt
├── db.json            # LowDB database
├── seeder.js          # Demo data seeder
├── config/db.js       # DB connection
├── routes/            # API routes
├── middleware/auth.js # JWT guard
└── tests/             # Jest test suite
```

---

## ✅ Running Tests

```bash
npm test
# 28 tests, all passing ✅
```

---

## 📜 License

ISC © 2026 E-FOR-RENT
