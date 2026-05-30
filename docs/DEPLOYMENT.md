# Deployment

## Backend

Deploy the Express API to Render, Fly.io, Railway, AWS ECS, or a VM.

Required environment variables:

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=long-random-secret
AI_SERVICE_URL=https://your-ai-service.example.com
CORS_ORIGIN=https://your-admin.example.com
PORT=4000
```

Run:

```bash
npm --prefix backend ci
npm --prefix backend run prisma:generate
npm --prefix backend run build
npm --prefix backend run start
```

## Database

Use managed PostgreSQL. Run Prisma migrations during release:

```bash
npm --prefix backend run prisma:migrate
```

## Admin Dashboard

Build and host the static Vite app:

```bash
VITE_API_URL=https://api.example.com/api npm --prefix admin-dashboard run build
```

Deploy `admin-dashboard/dist` to Vercel, Netlify, Cloudflare Pages, or S3/CloudFront.

## Mobile App

Use Expo EAS:

```bash
npm --prefix mobile-app install
npx eas build --platform android
npx eas build --platform ios
```

Set `EXPO_PUBLIC_API_URL=https://api.example.com/api`.

## AI Service

Deploy FastAPI with Uvicorn/Gunicorn:

```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

## IoT

Flash ESP32 firmware or run the Raspberry Pi script after calibrating the load cell. Use HTTPS and a signed device token for production.
