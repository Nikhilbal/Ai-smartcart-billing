# Smart Cart Billing System

A practical MVP for a DMart/Amazon Go style supermarket self-billing system. The project includes:

- Expo React Native customer app
- React + TypeScript + Tailwind admin dashboard
- Node.js Express + Prisma + PostgreSQL backend
- Python FastAPI AI service
- Socket.io real-time alerts
- IoT weight sensor API logic for ESP32/Raspberry Pi

The system is designed to be highly reliable, not “100% accurate”: barcode scan records, cart weight verification, payment status, QR receipt, exit verification, admin review, and fraud alerts all work together.

## Project Structure

```txt
smart-cart-billing-system/
  backend/              Express API, Prisma schema, seed data, Socket.io
  mobile-app/           Expo React Native customer app
  admin-dashboard/      React admin dashboard
  ai-service/           FastAPI recommendation and fraud service
  iot/                  ESP32 and Raspberry Pi sensor integration examples
  docs/                 Architecture and deployment notes
  postman/              API testing examples
```

## Quick Start

```bash
cp .env.example backend/.env
docker compose up -d postgres
npm install
npm --prefix backend run prisma:migrate
npm run seed
npm run dev:backend
```

In separate terminals:

```bash
npm run dev:admin
npm run dev:mobile
cd ai-service && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Default admin:

- Email: `admin@smartcart.local`
- Password: `admin123`

Demo customer OTP:

- Any Indian 10-digit mobile number
- OTP: `123456`

## Core Business Rules

- Every scanned product creates or updates a `cart_items` record.
- Cart item status flows through `SCANNED -> VERIFIED -> BILLED`.
- Before payment, cart weight must pass verification.
- Weight variance formula:

```txt
variance = abs(actual_weight - expected_weight) / expected_weight * 100
```

- `variance <= 2` means `VERIFIED`.
- `variance > 2` means `FAILED`, creates a fraud event, and notifies admins.
- Payment success marks cart payment as `PAID` and cart items as `BILLED`.
- Exit QR is generated only when `payment_status = PAID` and `weight_status = VERIFIED`.
- Inventory below 50 units is shown as low stock and emitted to admin dashboards.

## Run URLs

- Backend API: `http://localhost:4000`
- Admin Dashboard: `http://localhost:5173`
- AI Service: `http://localhost:8001`
- Expo mobile: Expo terminal QR code

## Deployment Summary

- Backend: deploy Express API with `DATABASE_URL`, `JWT_SECRET`, and `AI_SERVICE_URL`.
- Database: managed PostgreSQL with Prisma migrations.
- Admin: build static Vite app and host on Vercel/Netlify/S3.
- Mobile: use EAS Build for Android/iOS.
- AI: deploy FastAPI service behind HTTPS.
- IoT: ESP32/Raspberry Pi posts signed weight readings to `/api/iot/weight`.

See [docs/ARCHITECTURE.md](/Users/balanikhil/Documents/Codex/2026-05-27/role-you-are-a-senior-full/docs/ARCHITECTURE.md) and [docs/DEPLOYMENT.md](/Users/balanikhil/Documents/Codex/2026-05-27/role-you-are-a-senior-full/docs/DEPLOYMENT.md).
