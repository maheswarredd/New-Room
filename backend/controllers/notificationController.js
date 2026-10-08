import DeviceToken from '../models/DeviceToken.js';
import { sendPushToUsers } from '../utils/fcm.js';

export const registerDevice = async (req, res) => {
  try {
    const { token, platform } = req.body;
    if (!token || !['web', 'android'].includes(platform)) {
      return res.status(400).json({ success: false, message: 'token and platform (web/android) are required.' });
    }
    await DeviceToken.findOneAndUpdate(
      { token },
      { user: req.user._id, token, platform, userAgent: req.get('user-agent') || '', lastSeenAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.json({ success: true, message: 'Notification device registered.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const unregisterDevice = async (req, res) => {
  try {
    const { token } = req.body;
    if (token) await DeviceToken.deleteOne({ token, user: req.user._id });
    return res.json({ success: true, message: 'Notification device removed.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const testNotification = async (req, res) => {
  try {
    const result = await sendPushToUsers([req.user._id], {
      title: 'RoomExpenses',
      body: 'Push notifications are working correctly.',
    }, { type: 'test', url: '/' });
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
