import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  CreditCard,
  Users,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export default function MonthlyReports() {
  const { showToast } = useAuth();
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonths();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchStatement(selectedMonth);
    }
  }, [selectedMonth]);

  const fetchMonths = async () => {
    try {
      const res = await api.get('/summary/months');
      if (res.data.success) {
        setMonths(res.data.months || []);
        const cur = res.data.currentMonth || res.data.months[0];
        setSelectedMonth(cur);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStatement = async (monthKey) => {
    try {
      setLoading(true);
      const res = await api.get(`/summary/monthly?month=${monthKey}`);
      if (res.data.success) {
        setSummaryData(res.data);
      }
    } catch (err) {
      showToast('Failed to load statement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currency = summaryData?.settings?.currency || '₹';
  const ledgers = summaryData?.memberLedgers || [];
  const roomSummary = summaryData?.roomSummary || {};

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Monthly Financial Ledger & Statement
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete split statement with carryover balances, expenses, and net settlement calculation.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <Calendar className="w-4 h-4 text-indigo-600" />
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

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Statement</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Room Expenses</span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">
                {currency}{(roomSummary.totalRoomExpenses || 0).toLocaleString()}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Groceries, rent, bills & dining for {selectedMonth}</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Payments Collected</span>
              <h3 className="text-2xl font-black text-emerald-600 mt-2">
                {currency}{(roomSummary.totalPaymentsReceived || 0).toLocaleString()}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Direct member transfers into room fund</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Room Members</span>
              <h3 className="text-2xl font-black text-indigo-600 mt-2">
                {roomSummary.activeMembers || 0} Members
              </h3>
              <p className="text-xs text-slate-500 mt-1">Equal split divisor for shared expenses</p>
            </div>
          </div>

          {/* Full Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Detailed Member Balances Sheet ({selectedMonth})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Positive Net Balance means the room owes the member (Advance/Credit). Negative Net Balance means the member owes the room (Pending Due).
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Prev Carryover (A)</th>
                    <th className="py-3 px-4">Expense Share (B)</th>
                    <th className="py-3 px-4">Rent Dues (C)</th>
                    <th className="py-3 px-4">Expenses Paid (D)</th>
                    <th className="py-3 px-4">Direct Payments (E)</th>
                    <th className="py-3 px-4">Adjustments (F)</th>
                    <th className="py-3 px-4 text-right">Net Balance (A-B-C+D+E+F)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {ledgers.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-400">
                        No member records available for this month.
                      </td>
                    </tr>
                  ) : (
                    ledgers.map((row) => {
                      const isDue = row.netBalance < 0;
                      return (
                        <tr key={row.member.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block">{row.member.name}</span>
                            <span className="text-[10px] text-slate-400">
                              {row.member.roomNo ? `Room ${row.member.roomNo}` : row.member.email}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-slate-600">
                            {currency}{row.carryForward.toLocaleString()}
                          </td>

                          <td className="py-3.5 px-4 text-slate-600">
                            {currency}{row.expenseShare.toLocaleString()}
                          </td>

                          <td className="py-3.5 px-4 text-slate-600">
                            {currency}{row.fixedRentDue.toLocaleString()}
                          </td>

                          <td className="py-3.5 px-4 text-emerald-600 font-semibold">
                            {currency}{row.expensesPaid.toLocaleString()}
                          </td>

                          <td className="py-3.5 px-4 text-emerald-600 font-semibold">
                            {currency}{row.directPayments.toLocaleString()}
                          </td>

                          <td className="py-3.5 px-4 text-slate-500">
                            {row.adjustments !== 0 ? (
                              <span className={row.adjustments > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                {row.adjustments > 0 ? `+${row.adjustments}` : row.adjustments}
                              </span>
                            ) : (
                              '0'
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {isDue ? (
                              <div className="inline-block text-right">
                                <span className="font-black text-rose-600 text-sm block">
                                  - {currency}{Math.abs(row.netBalance).toLocaleString()}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-rose-500">
                                  Pending Due
                                </span>
                              </div>
                            ) : row.netBalance > 0 ? (
                              <div className="inline-block text-right">
                                <span className="font-black text-emerald-600 text-sm block">
                                  + {currency}{row.netBalance.toLocaleString()}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-emerald-500">
                                  Advance Paid
                                </span>
                              </div>
                            ) : (
                              <div className="inline-block text-right">
                                <span className="font-black text-slate-600 text-sm block">
                                  {currency}0
                                </span>
                                <span className="text-[10px] uppercase font-bold text-slate-400">
                                  Settled
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
