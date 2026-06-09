# Deployment

## What URL should users open?

Do not give customers or admins the AI/backend API URL. API URLs return JSON and are used internally.

Open these UI services after deployment:

- Admin/staff panel: `smart-cart-admin-ui`
- Customer shopping app: `smart-cart-customer-ui`

API services are only for app-to-server communication:

- Backend API: `smart-cart-backend`
- AI API: `smart-cart-ai-service`

## Render Blueprint

The repository includes `render.yaml` with four services:

```text
smart-cart-admin-ui       Admin dashboard UI
smart-cart-customer-ui    Customer shopping UI
smart-cart-backend        Express API
smart-cart-ai-service     FastAPI AI API
```

In Render, use **New → Blueprint**, connect this repo, and Render will create the UI and API services.

The blueprint also creates managed PostgreSQL as `smart-cart-postgres` and passes its connection string to the backend as `DATABASE_URL`.

## Backend

Deploy the Express API to Render, Fly.io, Railway, AWS ECS, or a VM.

Required environment variables:

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=long-random-secret
AI_SERVICE_URL=https://your-ai-service.example.com
CORS_ORIGIN=https://your-admin.example.com,https://your-customer.example.com
PORT=4000
OTP_PROVIDER=http
OTP_EXPOSE_DEMO_OTP=false
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

Run:

```bash
npm --prefix backend ci
npm --prefix backend run prisma:generate
npm --prefix backend run build
npm --prefix backend run prisma:deploy
npm --prefix backend run start
```

## Database

Use managed PostgreSQL. Run Prisma migrations during release:

```bash
npm --prefix backend run prisma:deploy
```

For the first MVP seed, run:

```bash
npm --prefix backend run seed
```

## Admin Dashboard

Build and host the static Vite app. On Render use:

```text
Service Type: Static Site
Root Directory: leave empty
Build Command: npm ci && npm run build:admin
Publish Directory: admin-dashboard/dist
Environment: VITE_API_URL=https://your-backend-url/api
```

Deploy `admin-dashboard/dist` to Render Static Site, Vercel, Netlify, Cloudflare Pages, or S3/CloudFront.

## Mobile App

For a browser demo of the customer app, deploy the Expo web export. On Render use:

```text
Service Type: Static Site
Root Directory: leave empty
Build Command: npm ci && npm run build:customer
Publish Directory: mobile-app/dist
Environment: EXPO_PUBLIC_API_URL=https://your-backend-url/api
```

For real Android/iOS app store builds, use Expo EAS:

```bash
cd mobile-app
npm ci
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform android --profile production
npx eas-cli@latest build --platform ios --profile production
```

Set `EXPO_PUBLIC_API_URL=https://api.example.com/api`.

Set `EXPO_PUBLIC_DEMO_OTP=false` for store builds.

For full Play Store and App Store steps, see [MOBILE_STORE_DEPLOYMENT.md](/Users/balanikhil/Documents/Codex/2026-05-27/role-you-are-a-senior-full/docs/MOBILE_STORE_DEPLOYMENT.md).

For live OTP, Razorpay, PostgreSQL, and provider requirements, see [PRODUCTION_READINESS.md](/Users/balanikhil/Documents/Codex/2026-05-27/role-you-are-a-senior-full/docs/PRODUCTION_READINESS.md).

## AI Service

Deploy FastAPI with Uvicorn/Gunicorn:

```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

## IoT

Flash ESP32 firmware or run the Raspberry Pi script after calibrating the load cell. Use HTTPS and a signed device token for production.
