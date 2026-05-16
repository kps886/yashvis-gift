# Monika Creation — Full Stack Shop Website

A complete e-commerce platform with a 4-tier role hierarchy, JWT authentication, and React frontend.

---

## 🗂 Project Structure

```
monika creation/
├── backend/          ← Express + MongoDB API
└── frontend/         ← React + Tailwind UI
```

---

## ⚡ Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
```

Edit `.env`:
```
MONGO_URI=mongodb://127.0.0.1:27017/monika-creation
PORT=5001
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRE=30d
```

Create your first admin account:
```bash
node seed.js
```

Start the server:
```bash
npm run dev       # development (with nodemon)
npm start         # production
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

The app runs on `http://localhost:3000`. The proxy in `package.json` forwards `/api/*` to the backend at port 5001.

---

## 👥 Role Hierarchy

| Role | Level | What they can do |
|------|-------|-----------------|
| **Admin** | 4 (highest) | Everything — manage all users, assign roles, full product CRUD, view all dashboards |
| **Shopkeeper** | 3 | Create, edit, delete products. View inventory. Cannot manage users. |
| **Employee** | 2 | Update stock levels on existing products. View inventory alerts. |
| **User (End User)** | 1 (default) | Browse products, add to cart, checkout, leave reviews |

### Login → Dashboard Routing

After login, users are redirected automatically:
- Admin → `/admin`
- Shopkeeper → `/shopkeeper`
- Employee → `/employee`
- User → `/` (shop homepage)

---

## 🔐 API Endpoints

### Auth (Public)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/users/register` | Register as end user |
| POST | `/api/users/login` | Login (any role) |

### User (Protected)
| Method | Route | Access |
|--------|-------|--------|
| GET | `/api/users/profile` | All logged-in users |
| PUT | `/api/users/profile` | All logged-in users |
| GET | `/api/users` | Admin only |
| POST | `/api/users/create` | Admin only |
| PUT | `/api/users/:id` | Admin only |
| DELETE | `/api/users/:id` | Admin only |

### Products
| Method | Route | Access |
|--------|-------|--------|
| GET | `/api/products` | Public |
| GET | `/api/products/:id` | Public |
| POST | `/api/products` | Shopkeeper + Admin |
| PUT | `/api/products/:id` | Employee + Shopkeeper + Admin |
| DELETE | `/api/products/:id` | Shopkeeper + Admin |
| POST | `/api/products/:id/reviews` | Any logged-in user |

---

## 🚀 Deployment

### Option A: Deploy on a VPS (Ubuntu)

**Backend:**
```bash
# Install Node.js, MongoDB
sudo apt install nodejs npm mongodb

# Install PM2 for process management
npm install -g pm2

cd backend
npm install
pm2 start server.js --name monika-creation-api
pm2 save
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve the build/ folder via Nginx
```

**Nginx config example:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Serve React build
    root /var/www/monika-creation/frontend/build;
    index index.html;

    # API proxy
    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # React Router fallback
    location / {
        try_files $uri /index.html;
    }
}
```

### Option B: Cloud Deployment

**Backend → Railway / Render:**
- Push backend folder to a Git repo
- Set environment variables: `MONGO_URI`, `JWT_SECRET`, `PORT`
- Deploy as a Node.js web service

**Frontend → Vercel / Netlify:**
- Push frontend folder to a Git repo  
- Set build command: `npm run build`
- Set output directory: `build`
- Add environment variable: `REACT_APP_API_URL=https://your-backend-url.com`

Then update frontend to use the env variable in API calls.

**MongoDB → MongoDB Atlas (free tier):**
- Create cluster at mongodb.com/atlas
- Get connection string and set as `MONGO_URI`

---

## 🔧 Environment Variables

### Backend `.env`
```
MONGO_URI=           # MongoDB connection string
PORT=5001            # Server port
JWT_SECRET=          # Long random string (32+ chars)
JWT_EXPIRE=30d       # Token expiry
```

---

## 📦 Tech Stack

**Backend:**
- Express.js 5
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- bcryptjs (password hashing)

**Frontend:**
- React 19
- React Router v7
- Axios
- Tailwind CSS

---

## 🔑 First Time Setup Checklist

- [ ] Clone/copy project files
- [ ] `cd backend && npm install`
- [ ] Edit `.env` with your MongoDB URI and a strong JWT_SECRET
- [ ] `node seed.js` to create admin user
- [ ] `cd frontend && npm install`
- [ ] `npm start` in both folders
- [ ] Login at `http://localhost:3000` with `admin@monikacreation.com` / `admin123456`
- [ ] Change admin password immediately via profile
- [ ] Create shopkeeper and employee accounts via Admin Dashboard
