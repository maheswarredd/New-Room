import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Receipt,
  CreditCard,
  CheckSquare,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  Plus,
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [dashboardMetrics, setDashboardMetrics] = useState(null);

  useEffect(() => {
    fetchInitial();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchMonthlySummary(selectedMonth);
    }
  }, [selectedMonth]);

  const fetchInitial = async () => {
    try {
      setLoading(true);
      const [monthsRes, metricsRes] = await Promise.all([
        api.get('/summary/months'),
        api.get('/summary/dashboard'),
      ]);

      if (monthsRes.data.success) {
        setMonths(monthsRes.data.months || []);
        const cur = monthsRes.data.currentMonth || monthsRes.data.months[0];
        setSelectedMonth(cur);
        await fetchMonthlySummary(cur);
      }

      if (metricsRes.data.success) {
        setDashboardMetrics(metricsRes.data.metrics);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlySummary = async (monthKey) => {
    try {
      const res = await api.get(`/summary/monthly?month=${monthKey}`);
      if (res.data.success) {
        setSummaryData(res.data);
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  const currency = summaryData?.settings?.currency || '₹';
  const totalRoomExpenses = summaryData?.roomSummary?.totalRoomExpenses || 0;
  const totalPayments = summaryData?.roomSummary?.totalPaymentsReceived || 0;
  const activeMembersCount = summaryData?.roomSummary?.activeMembers || 0;
  const pendingTasksCount = dashboardMetrics?.pendingTasksCount || 0;
  const adminPaidExpenses = summaryData?.roomSummary?.adminPaidExpenses || 0;
  const memberPaidExpenses = summaryData?.roomSummary?.memberPaidExpenses || 0;
  const remainingBalance = summaryData?.roomSummary?.remainingBalance || 0;
  const ledgers = summaryData?.memberLedgers || [];

  const categoryNames = {
    rent: 'Room Rent',
    grocery: 'Kitchen & Groceries',
    electricity: 'Electricity & Bills',
    restaurant: 'Outside Food',
    daily: 'Daily Expenses',
    maintenance: 'Maintenance',
    other: 'Miscellaneous',
  };

  const categoryColors = {
    rent: 'bg-purple-100 text-purple-800 border-purple-200',
    grocery: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    electricity: 'bg-amber-100 text-amber-800 border-amber-200',
    restaurant: 'bg-orange-100 text-orange-800 border-orange-200',
    daily: 'bg-blue-100 text-blue-800 border-blue-200',
    maintenance: 'bg-rose-100 text-rose-800 border-rose-200',
    other: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, <span className="font-semibold text-slate-700">{user?.name}</span>. Here is the financial and room status.
          </p>
        </div>

        {/* Month selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-semibold text-slate-500">Month:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-sm font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expense Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Expenses</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">
              {currency}{totalRoomExpenses.toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>Selected month total</span>
            </p>
          </div>
        </div>

        {/* Payments Settled Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payments Collected</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-600">
              {currency}{totalPayments.toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Direct rent & payments recorded</p>
          </div>
        </div>

        {/* Active Members Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Room Members</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">{activeMembersCount} Active</h3>
            <Link to="/admin/members" className="text-xs text-indigo-600 font-semibold hover:underline mt-1 block">
              Manage all room members &rarr;
            </Link>
          </div>
        </div>

        {/* Pending Work Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Works</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-amber-600">{pendingTasksCount} Tasks</h3>
            <Link to="/admin/tasks" className="text-xs text-indigo-600 font-semibold hover:underline mt-1 block">
              View task assignments &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Room Money Summary */}
      <section className="bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-lg text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold">Room Money Summary</h2>
            <p className="text-xs text-slate-300 mt-1">Clear view of expenses, admin contribution and remaining member balance.</p>
          </div>
          <span className="text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full">{selectedMonth}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-[11px] uppercase tracking-wider text-slate-300 font-bold">Total Amount Added</p>
            <p className="text-2xl font-black mt-2">{currency}{totalRoomExpenses.toLocaleString()}</p>
            <p className="text-[11px] text-slate-300 mt-1">All room expenses</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-[11px] uppercase tracking-wider text-slate-300 font-bold">Admin Paid</p>
            <p className="text-2xl font-black mt-2 text-amber-300">{currency}{adminPaidExpenses.toLocaleString()}</p>
            <p className="text-[11px] text-slate-300 mt-1">Expenses paid by Admin</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-[11px] uppercase tracking-wider text-slate-300 font-bold">Member Paid Expenses</p>
            <p className="text-2xl font-black mt-2 text-emerald-300">{currency}{memberPaidExpenses.toLocaleString()}</p>
            <p className="text-[11px] text-slate-300 mt-1">Paid directly by members</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-[11px] uppercase tracking-wider text-slate-300 font-bold">Remaining Balance</p>
            <p className="text-2xl font-black mt-2 text-rose-300">{currency}{remainingBalance.toLocaleString()}</p>
            <p className="text-[11px] text-slate-300 mt-1">Current member pending dues</p>
          </div>
        </div>
      </section>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/admin/members"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition"
        >
          <Plus className="w-4 h-4" /> Add Room Member
        </Link>
        <Link
          to="/admin/expenses"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition"
        >
          <Plus className="w-4 h-4" /> Add Room Expense
        </Link>
        <Link
          to="/admin/payments"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition"
        >
          <Plus className="w-4 h-4" /> Record Settlement / Rent
        </Link>
        <Link
          to="/admin/tasks"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition"
        >
          <Plus className="w-4 h-4" /> Create Pending Task
        </Link>
      </div>

      {/* Category Expenses Breakdown */}
      {summaryData?.roomSummary?.categoryTotals && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
            Monthly Expense Category Breakdown ({selectedMonth})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {Object.entries(summaryData.roomSummary.categoryTotals).map(([catKey, amount]) => (
              <div
                key={catKey}
                className={`p-3 rounded-xl border ${categoryColors[catKey] || 'bg-slate-50 text-slate-800'}`}
              >
                <span className="block text-[11px] font-bold uppercase truncate">
                  {categoryNames[catKey] || catKey}
                </span>
                <span className="text-base font-extrabold mt-1 block">
                  {currency}{amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member Financial Balances & Carryovers */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Member Balances & Dues ({selectedMonth})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Includes expenses paid, individual shares, previous carry forward, and net balance.
            </p>
          </div>
          <Link
            to="/admin/ledger"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Full Detailed Ledger</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Previous Carryover</th>
                <th className="py-3 px-4">Expense Share</th>
                <th className="py-3 px-4">Total Paid</th>
                <th className="py-3 px-4">Adjustments</th>
                <th className="py-3 px-4">Net Balance / Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {ledgers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No active room members found. Click "Add Room Member" to start!
                  </td>
                </tr>
              ) : (
                ledgers.map((item) => {
                  const isDue = item.netBalance < 0;
                  const isAdvance = item.netBalance > 0;
                  return (
                    <tr key={item.member.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs overflow-hidden">
                            {item.member.avatar ? (
                              <img
                                src={item.member.avatar}
                                alt={item.member.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              item.member.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{item.member.name}</p>
                            <p className="text-[10px] text-slate-500">
                              {item.member.roomNo ? `Room ${item.member.roomNo}` : item.member.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {currency}{item.carryForward.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {currency}{item.totalShareDue.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 font-semibold text-emerald-700">
                        {currency}{item.totalPaid.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {item.adjustments !== 0 ? (
                          <span className={item.adjustments > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {item.adjustments > 0 ? `+${item.adjustments}` : item.adjustments}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {isDue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            Due: {currency}{item.pendingDue.toLocaleString()}
                          </span>
                        ) : isAdvance ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            Advance: {currency}{item.advanceBalance.toLocaleString()}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                            Settled ({currency}0)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/admin/members?view=${item.member.id}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-[11px] font-bold transition"
                        >
                          Details / Adjust
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Pending Tasks section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Pending Tasks</h2>
            <p className="text-xs text-slate-500">Room chores, grocery runs, and repair duties</p>
          </div>
          <Link
            to="/admin/tasks"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Manage Tasks</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {dashboardMetrics?.recentTasks?.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            No active pending tasks right now. Great job keeping the room clean and organized!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardMetrics?.recentTasks?.map((task) => (
              <div
                key={task._id}
                className="p-4 rounded-xl border border-slate-200/80 hover:border-indigo-200 hover:shadow-sm transition bg-slate-50/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{task.title}</h4>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      task.priority === 'urgent'
                        ? 'bg-rose-100 text-rose-700'
                        : task.priority === 'high'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="capitalize">{task.status.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                    <span>
                      {task.assignedTo?.length > 0
                        ? task.assignedTo.map((a) => a.name).join(', ')
                        : 'Unassigned'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
