# Sanitary Shop (MERN)
Customer store + admin panel. COD only, shipping by distance and weight, SMS on orders.

## Run locally
1. Install Node 18+ and create a free MongoDB Atlas cluster.
2. `cd server && cp .env.example .env` (fill MONGO_URI, JWT_SECRET) then `npm install && npm run dev`
   The admin account is created on first start from ADMIN_PHONE / ADMIN_PASSWORD in .env.
3. `cd client && cp .env.example .env && npm install && npm run dev` -> http://localhost:5173
4. Login with the admin phone/password, open Admin, add products, vendors and purchases.

## Shipping rates
Edit SLABS, PER_KG and FREE_ABOVE in `server/utils.js`. Set SHOP_PINCODE in `.env`.
Distance is from shop pincode to customer pincode (OpenStreetMap lookup).

## SMS
Set FAST2SMS_KEY (needs DLT template approval in India). Without a key, SMS text prints in the server console.

## Deploy
- Database: MongoDB Atlas. Backend: Render/Railway (build `npm install`, start `node server.js`, set env vars, CLIENT_URL = frontend URL).
- Frontend: Vercel/Netlify (root `client`, build `npm run build`, output `dist`, env VITE_API_URL = https://YOUR-API/api).
