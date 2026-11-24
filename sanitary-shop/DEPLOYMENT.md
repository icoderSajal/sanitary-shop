# Deployment guide: Render (backend) + Vercel (frontend) + MongoDB Atlas (database)

Order matters: **Database → Backend → Frontend → connect them**. Everything below works on free plans.

---

## 0. Before you start

- A free account on GitHub, MongoDB Atlas, Render and Vercel.
- Node.js 18 or newer installed locally (only needed if you want to test on your computer first).

## 1. Put the code on GitHub

1. Create a new empty repository on GitHub, for example `sanitary-shop`.
2. In the project folder (the one containing `backend` and `frontend`) run:
   ```bash
   git init
   git add .
   git commit -m "Sanitary shop MERN app"
   git branch -M main
   git remote add origin https://github.com/YOUR-NAME/sanitary-shop.git
   git push -u origin main
   ```
3. The `.gitignore` files already keep `node_modules` and `.env` out of GitHub. Never upload `.env`.

## 2. Database: MongoDB Atlas

1. Create a free **M0** cluster.
2. **Database Access** → Add New Database User → username and password (use letters and numbers only, so you do not need to encode the password).
3. **Network Access** → Add IP Address → **Allow access from anywhere** (`0.0.0.0/0`). Render's free plan has no fixed IP.
4. **Database** → Connect → Drivers → copy the connection string. It looks like
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
5. Replace `USER` and `PASSWORD`, and add the database name before the `?`:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/sanitary-shop?retryWrites=true&w=majority`
   Keep this for step 3.

## 3. Backend on Render

1. Render dashboard → **New +** → **Web Service** → connect your GitHub repo.
2. Fill in:
   | Field | Value |
   |---|---|
   | Root Directory | `backend` |
   | Runtime | Node |
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Instance type | Free |
3. Under **Environment Variables** add:
   | Key | Value |
   |---|---|
   | `MONGO_URI` | your Atlas string from step 2 |
   | `JWT_SECRET` | any long random text (30+ characters) |
   | `CLIENT_URL` | `http://localhost:5173` for now (you will change it in step 5) |
   | `ADMIN_EMAIL` | the email you will use to log in as admin |
   | `ADMIN_PASSWORD` | a strong password |
   | `SHOP_LAT` / `SHOP_LNG` | your shop's latitude and longitude (right-click your shop on Google Maps to copy them) |
   | `SHIP_BASE`, `SHIP_PER_KM`, `SHIP_PER_KG` | shipping rates in rupees, e.g. 40, 2, 3 |
   | `FAST2SMS_KEY` | optional, leave empty to skip SMS |
   Optional: `NODE_VERSION` = `20`.
4. Click **Create Web Service**. Wait until the log says `API running on port ...`.
5. Open `https://YOUR-SERVICE.onrender.com/api/health`. You should see `{"ok":true,"db":true}`.
   Copy your Render URL, you need it next.

The admin account is created automatically the first time the server starts.

**Optional sample data:** Render dashboard → your service → **Shell** → `npm run seed` (adds sample categories and products). On the free plan the Shell may be unavailable; just add products from the admin panel instead.

## 4. Frontend on Vercel

1. Vercel dashboard → **Add New…** → **Project** → import the same GitHub repo.
2. Configure:
   | Field | Value |
   |---|---|
   | Framework Preset | Vite |
   | Root Directory | `frontend` |
   | Build Command | `npm run build` (default) |
   | Output Directory | `dist` (default) |
3. **Environment Variables**: `VITE_API_URL` = your Render URL, for example `https://sanitary-shop-api.onrender.com` (no trailing slash, no `/api`).
4. Click **Deploy**. Copy your Vercel URL, for example `https://sanitary-shop.vercel.app`.
5. `frontend/vercel.json` is already included, so refreshing pages like `/cart` or `/admin` will not give a 404.

## 5. Connect them (do not skip)

1. Go back to Render → your service → **Environment** → set `CLIENT_URL` to your Vercel URL, exactly, with no trailing slash:
   `https://sanitary-shop.vercel.app`
   If you also use a custom domain, separate with commas: `https://sanitary-shop.vercel.app,https://www.yourshop.com`
2. Save. Render redeploys automatically.
3. Open your Vercel site → **Log in** with `ADMIN_EMAIL` / `ADMIN_PASSWORD` → you land on the admin dashboard.

## 6. First-time setup inside the app

1. Admin → **Products and categories** → add categories (PVC Pipes, CPVC Pipes, Fittings, Ceramics, Taps…).
2. Add products. Enter purchase rate, sale rate and weight. Use weight `0` for light items, their shipping depends on distance only.
3. Admin → **Vendors and purchases** → add vendors, then record purchases. Stock goes up automatically.
4. Register a normal customer account in a private window and place a test order.

## 7. How shipping is calculated

- Distance: from the customer's GPS location to `SHOP_LAT`/`SHOP_LNG` (with a 1.3 road factor), or the km the customer types.
- No-weight items: `SHIP_BASE + distance × SHIP_PER_KM`
- Items with weight: the above `+ weight × SHIP_PER_KG × (1 + distance/100)`, so heavy items cost more over long distances.
- Set `FREE_SHIP_ABOVE` to an order value to give free shipping above it (0 turns it off).
  Change the rates in Render environment variables, no code changes needed.

## 8. Troubleshooting

| Problem                                                    | Fix                                                                                                                                                           |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First request takes 30 to 60 seconds                       | Render free services sleep after 15 minutes idle. Normal. Use a paid plan or a free uptime pinger on `/api/health`.                                           |
| "Origin not allowed by CORS" or network error              | `CLIENT_URL` on Render must match the Vercel URL exactly (https, no trailing slash). Save and wait for redeploy.                                              |
| Products never load, requests go to localhost              | `VITE_API_URL` is missing. Add it in Vercel, then **Redeploy** (Vite reads it at build time).                                                                 |
| Render log: `MongoServerError: bad auth`                   | Wrong Atlas username or password in `MONGO_URI`.                                                                                                              |
| Render log: `ECONNREFUSED` or `server selection timed out` | Atlas Network Access does not allow `0.0.0.0/0`.                                                                                                              |
| Startup failed: JWT_SECRET is missing                      | Add `JWT_SECRET` in Render environment variables.                                                                                                             |
| Can't log in as admin                                      | Admin is created only if that email does not exist. Check `ADMIN_EMAIL` and `ADMIN_PASSWORD`, or register another user and change `role` to `admin` in Atlas. |
| Product images do not show                                 | Use a direct `https://` image link. Render's disk is temporary, so uploads would be lost; for uploads, add Cloudinary later.                                  |

## 9. Run locally (optional)

```bash
cd backend && cp .env.example .env   # fill MONGO_URI and JWT_SECRET
npm install && npm run dev           # http://localhost:5000
cd ../frontend && cp .env.example .env
npm install && npm run dev           # http://localhost:5173

```

<!-- backendurl=https://sanitary-shop.onrender.com/ -->

<!-- frontendurl=https://sanitary-shop-nine.vercel.app -->
