# Architecture

## Services

- Mobile app: Expo React Native customer app for scan, cart, verification, payment, receipt, and exit QR.
- Admin dashboard: React dashboard for inventory, sales, live carts, low stock, fraud incidents, customers, and bills.
- Backend API: Express + Prisma + PostgreSQL. Owns auth, cart, payment, bill, exit, inventory, fraud, and real-time sockets.
- AI service: FastAPI service for recommendation and fraud scoring helpers.
- IoT: ESP32/Raspberry Pi posts scale readings to `/api/iot/weight`.

## Reliability Model

The MVP does not claim perfect accuracy. It combines barcode scan records, inventory state, weight verification with 2% tolerance, payment status, QR receipt, exit verification, and admin review. Failed weight verification creates a fraud event and notifies admins through Socket.io.

## Important Flow

1. Customer scans barcode.
2. Backend records `cart_items.status = SCANNED`.
3. Customer starts weight verification.
4. Backend computes expected weight from scanned products and compares sensor/manual actual weight.
5. If variance is within 2%, items become `VERIFIED`.
6. Payment is accepted only after `weight_status = VERIFIED`.
7. Paid cart items become `BILLED`.
8. Bill and exit QR are generated only when payment is paid and weight is verified.
9. Exit verification blocks unpaid or unverified attempts and creates a fraud event.
