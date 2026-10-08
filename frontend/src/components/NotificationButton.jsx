import React, { useState } from 'react';
import { Bell, BellRing, Loader2 } from 'lucide-react';
import { enablePushNotifications, sendTestPush } from '../services/pushNotifications';

export default function NotificationButton() {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(localStorage.getItem('room_push_enabled') === '1');

  const handleEnable = async () => {
    try {
      setLoading(true);
      await enablePushNotifications();
      setEnabled(true);
    } catch (error) {
      alert(error?.message || 'Could not enable notifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    try {
      setLoading(true);
      await sendTestPush();
      alert('Test notification sent.');
    } catch (error) {
      alert(error?.response?.data?.message || error?.message || 'Test notification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleEnable}
        disabled={loading}
        className="p-2 rounded-xl text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition disabled:opacity-50"
        title={enabled ? 'Notifications enabled' : 'Enable notifications'}
        aria-label={enabled ? 'Notifications enabled' : 'Enable notifications'}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : enabled ? <BellRing className="w-5 h-5 text-indigo-600" /> : <Bell className="w-5 h-5" />}
      </button>
      {enabled && (
        <button onClick={handleTest} disabled={loading} className="hidden xl:inline-flex px-2 py-1 rounded-lg text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100">
          Test
        </button>
      )}
    </div>
  );
}
