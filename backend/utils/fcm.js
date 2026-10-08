import jwt from 'jsonwebtoken';
import https from 'https';
import DeviceToken from '../models/DeviceToken.js';

let cachedAccessToken = null;
let cachedExpiresAt = 0;

const requestJson = (url, options, body) => new Promise((resolve, reject) => {
  const target = new URL(url);
  const req = https.request(
    target,
    { method: options.method || 'GET', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } },
    (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = {};
        try { parsed = data ? JSON.parse(data) : {}; } catch { parsed = { raw: data }; }
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
        else reject(Object.assign(new Error(parsed.error?.message || `HTTP ${res.statusCode}`), { statusCode: res.statusCode, response: parsed }));
      });
    }
  );
  req.on('error', reject);
  req.write(body);
  req.end();
});

const getServiceAccount = () => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (error) {
    console.error('[FCM] Invalid FIREBASE_SERVICE_ACCOUNT_JSON:', error.message);
    return null;
  }
};

const getAccessToken = async () => {
  const serviceAccount = getServiceAccount();
  if (!serviceAccount?.client_email || !serviceAccount?.private_key || !serviceAccount?.project_id) return null;
  if (cachedAccessToken && Date.now() < cachedExpiresAt - 60_000) return cachedAccessToken;

  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    },
    serviceAccount.private_key.replace(/\\n/g, '\n'),
    { algorithm: 'RS256' }
  );

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  }).toString();

  const tokenResponse = await requestJson('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }, body);

  cachedAccessToken = tokenResponse.access_token;
  cachedExpiresAt = Date.now() + (Number(tokenResponse.expires_in || 3600) * 1000);
  return cachedAccessToken;
};

export const sendPushToUsers = async (userIds, notification, data = {}) => {
  const ids = [...new Set((userIds || []).filter(Boolean).map(String))];
  if (!ids.length) return { sent: 0, skipped: true };

  const serviceAccount = getServiceAccount();
  if (!serviceAccount) {
    console.warn('[FCM] Push skipped: FIREBASE_SERVICE_ACCOUNT_JSON is not configured.');
    return { sent: 0, skipped: true };
  }

  const accessToken = await getAccessToken();
  if (!accessToken) return { sent: 0, skipped: true };

  const devices = await DeviceToken.find({ user: { $in: ids } });
  let sent = 0;
  const projectId = serviceAccount.project_id;

  for (const device of devices) {
    try {
      await requestJson(
        `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
        { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } },
        JSON.stringify({
          message: {
            token: device.token,
            notification: {
              title: String(notification.title || 'RoomExpenses'),
              body: String(notification.body || ''),
            },
            data: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value ?? '')])),
            android: {
              priority: 'high',
              notification: { channel_id: 'roomexpenses', sound: 'default' },
            },
            webpush: {
              notification: { icon: '/pwa-192.png', badge: '/pwa-192.png' },
            },
          },
        })
      );
      sent += 1;
    } catch (error) {
      console.error(`[FCM] Failed for ${device.platform} token:`, error.message);
      if ([404, 410].includes(error.statusCode)) await DeviceToken.deleteOne({ _id: device._id });
    }
  }
  return { sent, skipped: false };
};
