# Production Readiness

This project is now prepared for a real deployment path, but the live production services still need your account credentials and store details. Keep all secrets in hosting/provider dashboards. Do not commit them.

## Public App Links

Razorpay, Apple, and Google may ask for a public app or website URL before approving production access.

Use these after Render deployment:

- Customer app link: `https://smart-cart-customer-ui.onrender.com`
- Admin panel link: `https://smart-cart-admin-ui.onrender.com`
- Backend health check: `https://smart-cart-backend.onrender.com/health`

If Render appends a suffix or you created services manually, use the actual URL shown at the top of each Render service page. The URLs above work only when the Blueprint service names are created exactly as written in `render.yaml`.

Use the customer app link for Razorpay onboarding. Do not use the AI service URL or backend API URL as the public customer app link.

## PostgreSQL

Render Blueprint deployment will create a managed PostgreSQL database named `smart-cart-postgres` and inject `DATABASE_URL` into the backend.

Backend deployment runs:

```bash
npm run prisma:deploy
```

On the first successful Render deploy, `initialDeployHook` runs:

```bash
npm run seed:prod
```

That creates the initial store, admin account, products, and sample user once. If you need to seed again later, run it as a Render one-off job instead of adding it to every start command.

## OTP Provider

Local/dev mode:

```bash
OTP_PROVIDER=demo
OTP_EXPOSE_DEMO_OTP=true
```

Production mode:

```bash
OTP_PROVIDER=http
OTP_EXPOSE_DEMO_OTP=false
OTP_HTTP_URL=https://provider.example.com/send
OTP_HTTP_METHOD=POST
OTP_HTTP_AUTH_HEADER=Authorization
OTP_HTTP_AUTH_VALUE=Bearer YOUR_PROVIDER_TOKEN
OTP_HTTP_BODY={"mobile":"{mobileWithCountryCode}","otp":"{otp}"}
```

The backend replaces:

- `{mobile}` with the 10-digit Indian mobile number
- `{mobileWithCountryCode}` with `91` plus the mobile number
- `{otp}` with the generated six-digit OTP

You can use MSG91, Fast2SMS, Twilio, or any SMS provider that supports an HTTP API. Share the provider API URL, auth key/header, and approved OTP template if you want this wired to a specific provider.

## Razorpay

Backend environment variables:

```bash
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

Available backend endpoints:

```text
GET  /api/payment/razorpay/config
POST /api/payment/razorpay/order
POST /api/payment/razorpay/verify
```

The secret key is used only on the backend. The mobile app should receive only `keyId` and the Razorpay order details from `/api/payment/razorpay/order`.

Razorpay production onboarding usually needs:

- Business/KYC approval
- Customer app or website link
- Support email and phone
- Refund/cancellation policy link if applicable
- Privacy policy link
- Terms of service link

## Mobile Store Builds

Before Play Store/App Store builds, replace these in `mobile-app/eas.json`:

```json
{
  "EXPO_PUBLIC_API_URL": "https://smart-cart-backend.onrender.com/api",
  "EXPO_PUBLIC_DEMO_OTP": "false"
}
```

You must provide:

- Apple Developer account access
- Google Play Console access
- Final app name and package/bundle ID
- Support email
- Privacy policy URL
- Store screenshots
- App icon approval
- Google Play service account JSON for automated submit

## Real Store Data Required

For every product:

- Product name
- Barcode number
- Category
- Selling price and MRP
- Net/gross weight in kilograms
- GST slab
- Stock quantity
- Supplier
- Product image URL
- Discount/offer rules

For physical verification:

- Calibrated load cell/HX711/ESP32 or Raspberry Pi setup
- Stable weighing platform/cart base
- Known calibration weights
- Store exit QR scanning device or staff/admin exit screen

## Production Testing Checklist

Run these tests before store release:

- OTP login with real SMS provider
- Product scan with actual barcode labels
- Manual barcode entry fallback
- Cart starts empty and updates badge count
- Weight verification passes within the configured tolerance
- Weight mismatch creates admin fraud alert
- UPI/card creates payment approval request
- Cash creates counter verification request
- Admin/counter approval unlocks receipt and exit QR
- Exit QR scan resets customer app to starting state
- Low-stock items below 50 appear in admin alerts
- PostgreSQL data persists after backend restart
