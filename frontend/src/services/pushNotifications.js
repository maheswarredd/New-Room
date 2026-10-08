import api from './api';

const isNative = () => Boolean(window.Capacitor?.isNativePlatform?.());

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasFirebaseConfig = () => Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId && firebaseConfig.appId && import.meta.env.VITE_FIREBASE_VAPID_KEY);

const registerToken = async (token, platform) => {
  if (!token) return false;
  await api.post('/notifications/register', { token, platform });
  localStorage.setItem('room_push_enabled', '1');
  return true;
};

export const enablePushNotifications = async () => {
  if (isNative()) {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    let permission = await PushNotifications.checkPermissions();
    if (permission.receive !== 'granted') permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') throw new Error('Notification permission was denied.');

    await PushNotifications.createChannel({
      id: 'roomexpenses',
      name: 'RoomExpenses',
      description: 'Room expenses, tasks, payments and balance alerts',
      importance: 5,
      sound: 'default',
      vibration: true,
    }).catch(() => {});

    await PushNotifications.removeAllListeners();
    await PushNotifications.addListener('registration', async ({ value }) => {
      try { await registerToken(value, 'android'); } catch (error) { console.error('FCM registration failed', error); }
    });
    await PushNotifications.addListener('registrationError', (error) => console.error('FCM registration error', error));
    await PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
      const url = event.notification?.data?.url;
      if (url) window.location.href = url;
    });
    await PushNotifications.register();
    return { platform: 'android', enabled: true };
  }

  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    throw new Error('This browser does not support push notifications.');
  }
  if (!hasFirebaseConfig()) {
    throw new Error('Firebase web notification environment variables are not configured.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission was denied.');

  const [{ initializeApp, getApps }, { getMessaging, getToken, onMessage }] = await Promise.all([
    import('firebase/app'),
    import('firebase/messaging'),
  ]);
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  const swUrl = `/firebase-messaging-sw.js?${new URLSearchParams(firebaseConfig).toString()}`;
  const registration = await navigator.serviceWorker.register(swUrl, { scope: '/' });
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  await registerToken(token, 'web');

  onMessage(messaging, async (payload) => {
    const title = payload.notification?.title || 'RoomExpenses';
    const body = payload.notification?.body || 'You have a new RoomExpenses update.';
    if (Notification.permission === 'granted') {
      await registration.showNotification(title, { body, icon: '/pwa-192.png', badge: '/pwa-192.png', data: payload.data || {} });
    }
  });

  return { platform: 'web', enabled: true };
};

export const sendTestPush = () => api.post('/notifications/test');
