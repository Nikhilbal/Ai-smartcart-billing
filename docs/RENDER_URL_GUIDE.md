# Render URL Guide

Use this when you see placeholder values such as:

```text
https://YOUR_ACTUAL_BACKEND_URL/api
https://YOUR_ADMIN_URL
https://YOUR_CUSTOMER_URL
```

These values come from the Render service pages after your Blueprint/services are created.

## Step 1: Open Your Render Dashboard

1. Go to https://dashboard.render.com
2. Open your Smart Cart project or Blueprint environment.
3. You should see services like:
   - `smart-cart-backend`
   - `smart-cart-admin-ui`
   - `smart-cart-customer-ui`
   - `smart-cart-ai-service`
   - `smart-cart-postgres`

If Render added a suffix, use the actual service name and URL Render shows.

## Step 2: Get Backend URL

1. Click the backend service.
2. Copy the public URL shown near the service title.
3. It will look like:

```text
https://smart-cart-backend-xxxx.onrender.com
```

4. Test it in browser:

```text
https://smart-cart-backend-xxxx.onrender.com/health
```

Expected result:

```json
{
  "ok": true,
  "service": "smart-cart-backend"
}
```

Use this in frontend envs:

```text
https://smart-cart-backend-xxxx.onrender.com/api
```

## Step 3: Get Customer App URL

1. Click the customer static site service.
2. Copy the URL shown by Render.
3. It will look like:

```text
https://smart-cart-customer-ui-xxxx.onrender.com
```

Set customer env:

```text
EXPO_PUBLIC_API_URL=https://smart-cart-backend-xxxx.onrender.com/api
EXPO_PUBLIC_DEMO_OTP=false
```

Redeploy the customer app after saving env variables.

## Step 4: Get Admin App URL

1. Click the admin static site service.
2. Copy the URL shown by Render.
3. It will look like:

```text
https://smart-cart-admin-ui-xxxx.onrender.com
```

Set admin env:

```text
VITE_API_URL=https://smart-cart-backend-xxxx.onrender.com/api
```

Redeploy the admin app after saving env variables.

## Step 5: Set Backend CORS

Open the backend service environment settings and set:

```text
CORS_ORIGIN=https://smart-cart-admin-ui-xxxx.onrender.com,https://smart-cart-customer-ui-xxxx.onrender.com
```

Also set Razorpay keys only on the backend service:

```text
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

Never put `RAZORPAY_KEY_SECRET` in the customer app or admin app.

## Step 6: Redeploy In Order

Redeploy in this order:

1. Backend
2. Admin UI
3. Customer UI

Then test:

```text
https://smart-cart-backend-xxxx.onrender.com/health
https://smart-cart-admin-ui-xxxx.onrender.com
https://smart-cart-customer-ui-xxxx.onrender.com
```

## Common Fixes

- `no-server`: the URL does not match an existing Render service. Copy the actual URL from the service page.
- `static-no-asset`: the static site publish directory is wrong or the build did not create `index.html`.
- Blank frontend page: check the browser console and verify the frontend env points to `/api` on the backend.
- CORS error: add both admin and customer origins to backend `CORS_ORIGIN`.
