# RoomExpenses Android App + Shared Push Notifications

This project is designed so the **Render website and Android app use the same Express API + MongoDB**. Notifications are sent through Firebase Cloud Messaging (FCM), so a member can use the website, the Android app, or both.

## 1. Firebase project

1. Create a Firebase project.
2. Enable Cloud Messaging.
3. Add a **Web app** and copy its Firebase configuration.
4. In Firebase Cloud Messaging, create a **Web Push certificate key (VAPID)**.
5. Add an **Android app** with package name:

`com.maheswar.roomexpenses`

6. Download `google-services.json`.

## 2. Render backend environment

Add this secret to the backend service:

`FIREBASE_SERVICE_ACCOUNT_JSON`

Create a Firebase service-account key from Firebase/Google Cloud and paste the complete JSON as a single environment-variable value. Never commit this JSON to GitHub.

The backend already uses its existing `jsonwebtoken` dependency to create the short-lived Google OAuth token required by the FCM HTTP v1 API. No Firebase Admin SDK is required on the server.

## 3. Render frontend environment

Set these variables on the frontend service:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_VAPID_KEY`

These web Firebase configuration values are not service-account secrets.

## 4. Generate the Android project

From `frontend/` on a machine with Node.js and Android Studio:

```bash
npm install
npm run build
npx cap add android
npx cap sync android
```

Copy Firebase's `google-services.json` into:

`frontend/android/app/google-services.json`

Then open Android Studio:

```bash
npx cap open android
```

Build and run the app on a real Android phone. For a Play Store release, generate an Android App Bundle (AAB), not just a debug APK.

## 5. Notification behavior

### Website / PWA

Member signs in → taps the bell → allows notifications → browser FCM token is saved to the backend.

### Android app

Member signs in → Android FCM permission is granted → native FCM token is saved to the same backend.

### Backend

The same `/api/notifications/register` endpoint stores both `web` and `android` device tokens. Expense/task/payment events call the same FCM sender.

Therefore one member can have:

- Website token
- Android phone token
- Another Android/browser token

and all registered devices can receive the relevant RoomExpenses notification.
