import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Toast from './Toast';
import api from '../services/api';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [roomName, setRoomName] = useState('RoomMate Pro');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data.success && res.data.settings?.roomName) {
          setRoomName(res.data.settings.roomName);
        }
      } catch (err) {
        // Fallback default
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Toast />
      <Navbar toggleMobileSidebar={() => setMobileOpen(!mobileOpen)} roomName={roomName} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
