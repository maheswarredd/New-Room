import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Wallet,
  Receipt,
  CreditCard,
  CheckSquare,
  Clock,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Calendar,
  CheckCircle,
} from 'lucide-react';

export default function MemberDashboard() {
  const { user, showToast } = useAuth();
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [statement, setStatement] = useState(null);
  const [myTasks, setMyTasks] = useState([]);

  useEffect(() => {
    fetchInitial();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchMyStatement(selectedMonth);
    }
  }, [selectedMonth]);

  const fetchInitial = async () => {
    try {
      setLoading(true);
      const [mRes, tasksRes] = await Promise.all([
        api.get('/summary/months'),
        api.get('/tasks?status=pending'),
      ]);

      if (mRes.data.success) {
        setMonths(mRes.data.months || []);
        const cur = mRes.data.currentMonth || mRes.data.months[0];
        setSelectedMonth(cur);
      }

      if (tasksRes.data.success) {
        setMyTasks(tasksRes.data.tasks || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyStatement = async (monthKey) => {
    try {
      const res = await api.get(`/summary/monthly?month=${monthKey}`);
      if (res.data.success) {
        setStatement(res.data);
      }
    } catch (err) {
      showToast('Error loading personal statement', 'error');
    }
  };

  const currency = statement?.settings?.currency || '₹';
  const myLedger = statement?.myLedger;

  const isDue = (myLedger?.netBalance || 0) < 0;
  const isAdvance = (myLedger?.netBalance || 0) > 0;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Welcome, {user?.name}!
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {user?.roomNo ? `Room ${user?.roomNo} • ` : ''}Your personalized room expense and task dashboard.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-semibold text-slate-500">Month:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Balance Hero Card */}
      <div
        className={`rounded-3xl p-6 sm:p-8 border shadow-sm transition ${
          isDue
            ? 'bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950 text-white border-rose-900/50'
            : isAdvance
            ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white border-emerald-900/50'
            : 'bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white border-indigo-900/50'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-slate-400 bg-white/10 px-3 py-1 rounded-full mb-3">
              Net Financial Position ({selectedMonth})
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black tracking-tight">
                {isDue
                  ? `- ${currency}${Math.abs(myLedger?.netBalance || 0).toLocaleString()}`
                  : isAdvance
                  ? `+ ${currency}${(myLedger?.netBalance || 0).toLocaleString()}`
                  : `${currency}0`}
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-2 font-medium">
              {isDue
                ? '⚠️ You have pending dues to settle with the room fund / Admin.'
                : isAdvance
                ? '✅ You have paid extra or covered more expenses than your share (Advance Credit).'
                : '🎉 All your expenses and rent are fully settled for this month!'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/member/payments"
              className="px-5 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-lg transition"
            >
              Record Settlement Payment
            </Link>
            <Link
              to="/member/expenses"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition"
            >
              Log Expense Paid By Me
            </Link>
          </div>
        </div>

        {/* Detailed Breakdown Pill Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Previous Carryover</span>
            <span className="font-extrabold text-base text-white mt-1 block">
              {currency}{(myLedger?.carryForward || 0).toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Your Share of Expenses</span>
            <span className="font-extrabold text-base text-white mt-1 block">
              {currency}{(myLedger?.totalShareDue || 0).toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Expenses You Paid</span>
            <span className="font-extrabold text-base text-emerald-400 mt-1 block">
              {currency}{(myLedger?.expensesPaid || 0).toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Direct Rent/Payments</span>
            <span className="font-extrabold text-base text-emerald-400 mt-1 block">
              {currency}{(myLedger?.directPayments || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout for Quick Actions & Pending Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Works Assigned to Me */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Pending Tasks Assigned to You
                  </h3>
                  <p className="text-[11px] text-slate-500">Chores, bills, and duties</p>
                </div>
              </div>
              <Link
                to="/member/tasks"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {myTasks.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No pending tasks!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  You are all caught up with your room responsibilities.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myTasks.slice(0, 3).map((task) => (
                  <div
                    key={task._id}
                    className="p-3 rounded-xl border border-slate-100 hover:border-indigo-200 transition bg-slate-50/50 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{task.title}</span>
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                            task.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-1 line-clamp-1">{task.description}</p>
                    </div>

                    <Link
                      to="/member/tasks"
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[11px] hover:bg-indigo-100 whitespace-nowrap"
                    >
                      Update
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-right">
            <Link
              to="/member/tasks"
              className="text-xs font-bold text-slate-600 hover:text-indigo-600"
            >
              Go to interactive task checklist &rarr;
            </Link>
          </div>
        </div>

        {/* Room Financial Health & Summary */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Room Overall Expenses</h3>
              <p className="text-[11px] text-slate-500">Shared room statistics for {selectedMonth}</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-slate-600">Total Room Expense:</span>
              <span className="font-extrabold text-slate-900 text-sm">
                {currency}{(statement?.roomSummary?.totalRoomExpenses || 0).toLocaleString()}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-slate-600">Active Room Members:</span>
              <span className="font-bold text-slate-900">
                {statement?.roomSummary?.activeMembers || 0} members sharing
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-slate-600">Monthly Rent Share:</span>
              <span className="font-bold text-slate-900">
                {currency}{myLedger?.fixedRentDue || 0}
              </span>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <Link to="/member/expenses" className="font-bold text-indigo-600 hover:underline">
              Browse All Expenses &rarr;
            </Link>
            <Link to="/member/payments" className="font-bold text-emerald-600 hover:underline">
              Payment History &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
