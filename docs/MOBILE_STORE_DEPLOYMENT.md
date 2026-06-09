# Mobile Store Deployment

This Expo app is prepared for real Android and iOS builds through Expo EAS.

Official references:

- Expo EAS Build setup: https://docs.expo.dev/build/setup/
- Expo EAS Submit: https://docs.expo.dev/submit/introduction/
- Apple App Store Connect help: https://developer.apple.com/help/app-store-connect/
- Google Play Console help: https://support.google.com/googleplay/android-developer/

## What Is Already Configured

- Android package name: `com.smartcart.billing`
- iOS bundle identifier: `com.smartcart.billing`
- Android camera permission
- iOS camera usage description
- App icon, adaptive icon, splash image, and favicon
- EAS build profiles for preview APK and production store builds
- EAS submit profiles for Play Store and App Store submission

## Required From Your Side

1. Expo account
   - Create or login at https://expo.dev
   - Run `npx eas-cli@latest login`

2. Apple Developer account
   - Required for iOS App Store and TestFlight.
   - You need access to App Store Connect.
   - Keep the bundle ID as `com.smartcart.billing`, or tell me the final ID before build.

3. Google Play Console account
   - Required for Play Store release.
   - You need a Play app created for package `com.smartcart.billing`.
   - For automated submit, create a Google Play service account JSON and save it locally as:

```text
secrets/google-play-service-account.json
```

Do not commit this file.

4. Production backend URL
   - The mobile app must point to your deployed backend API, not localhost.
   - Replace this in `mobile-app/eas.json`:

```text
https://YOUR_BACKEND_URL/api
```

Example:

```text
https://smart-cart-backend.onrender.com/api
```

   - Keep `EXPO_PUBLIC_DEMO_OTP=false` for production builds.

5. Store listing details
   - App name
   - Short description
   - Full description
   - Support email
   - Privacy policy URL
   - App category
   - Screenshots for phone sizes
   - App icon
   - Data safety and app privacy answers

6. Real production services
   - Hosted backend
   - Hosted PostgreSQL database
   - Real OTP provider
   - Real payment gateway or cash counter-only pilot
   - Staff/admin accounts

7. Razorpay onboarding links
   - Use the deployed customer app URL as the app/website link:

```text
https://smart-cart-customer-ui.onrender.com
```

   - You also need a privacy policy URL, support email, and approved Razorpay KYC before live payments.

## Build Commands

Run all commands from `mobile-app`.

Install dependencies:

```bash
npm ci
npx eas-cli@latest login
npx eas-cli@latest init
```

Check project config:

```bash
npx expo-doctor
npx expo config --type public
```

Build Android APK for internal testing:

```bash
npx eas-cli@latest build --platform android --profile preview
```

Build Android AAB for Play Store:

```bash
npx eas-cli@latest build --platform android --profile production
```

Build iOS IPA for TestFlight/App Store:

```bash
npx eas-cli@latest build --platform ios --profile production
```

Build both stores:

```bash
npx eas-cli@latest build --platform all --profile production
```

## Submit Commands

Submit Android to Play Console internal track:

```bash
npx eas-cli@latest submit --platform android --profile production
```

Submit iOS to App Store Connect:

```bash
npx eas-cli@latest submit --platform ios --profile production
```

Submit both:

```bash
npx eas-cli@latest submit --platform all --profile production
```

## Recommended Release Flow

1. Deploy backend, database, AI service, and admin dashboard.
2. Replace `EXPO_PUBLIC_API_URL` in `mobile-app/eas.json`.
3. Set `EXPO_PUBLIC_DEMO_OTP=false`.
4. Build Android preview APK.
5. Install APK on a real Android phone.
6. Test camera scanning with real products.
7. Test login, cart, weight verification, cash counter approval, receipt, and exit QR.
8. Fix issues found on device.
9. Build production Android AAB and iOS IPA.
10. Upload to internal testing/TestFlight first.
11. Test with store staff in the actual supermarket.
12. Submit for public review.

## Store Privacy Notes

The app uses camera access for barcode scanning and stores customer/cart/payment flow data. Your store privacy answers should mention:

- Mobile number login
- Purchase history
- Cart items
- Payment status
- Camera access for barcode scanning
- Fraud/weight verification events

Do not claim the app is 100% fraud-proof. Use language like highly reliable fraud detection with admin review.
