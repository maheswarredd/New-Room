import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Settings, Save, Home, DollarSign, Shield, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const { showToast } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    roomName: '',
    currency: '₹',
    totalMonthlyRent: 0,
    defaultRentPerMember: 0,
    allowMemberAddExpense: true,
    allowMemberTaskUpdate: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data.success) {
        setSettings(res.data.settings);
      }
    } catch (err) {
      showToast('Failed to load room settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put('/settings', settings);
      if (res.data.success) {
        showToast('Settings saved successfully', 'success');
        setSettings(res.data.settings);
      }
    } catch (err) {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Room Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Customize room identity, currency symbol, default rent rules, and member permissions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Home className="w-4 h-4 text-indigo-600" />
            <span>Room Identity</span>
          </h3>
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Room / Flat / Apartment Name</label>
              <input
                type="text"
                required
                value={settings.roomName}
                onChange={(e) => setSettings({ ...settings, roomName: e.target.value })}
                placeholder="e.g. Happy Roomies Flat 402"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Currency Symbol</label>
              <input
                type="text"
                required
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                placeholder="₹ or $ or €"
                className="w-32 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold font-mono"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Rent Defaults</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Room Monthly Rent ({settings.currency})</label>
              <input
                type="number"
                value={settings.totalMonthlyRent}
                onChange={(e) => setSettings({ ...settings, totalMonthlyRent: e.target.value })}
                placeholder="e.g. 18000"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Default Rent Per Member ({settings.currency})</label>
              <input
                type="number"
                value={settings.defaultRentPerMember}
                onChange={(e) => setSettings({ ...settings, defaultRentPerMember: e.target.value })}
                placeholder="e.g. 4500"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600" />
            <span>Member Permissions</span>
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowMemberAddExpense}
                onChange={(e) => setSettings({ ...settings, allowMemberAddExpense: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Allow members to add room expenses</span>
                <span className="text-[11px] text-slate-500">
                  When enabled, room members can log items they paid for out of their own pocket.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowMemberTaskUpdate}
                onChange={(e) => setSettings({ ...settings, allowMemberTaskUpdate: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Allow members to update pending work status
                </span>
                <span className="text-[11px] text-slate-500">
                  When enabled, members can mark tasks In Progress or Completed when finished.
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-100 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
