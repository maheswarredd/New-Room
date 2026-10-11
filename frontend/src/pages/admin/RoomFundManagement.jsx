import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Wallet,
  TrendingDown,
  Banknote,
  Clock,
  PlusCircle,
  History,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';

export default function RoomFundManagement() {
  const { user, showToast } = useAuth();

  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');

  const [summary, setSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionDate, setContributionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    category: 'grocery',
    date: new Date().toISOString().slice(0, 10),
    description: '',
  });

  useEffect(() => {
    loadMonths();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      loadFundData();
    }
  }, [selectedMonth]);

  const loadMonths = async () => {
    try {
      const res = await api.get('/summary/months');

      if (res.data.success) {
        const availableMonths = res.data.months || [];

        setMonths(availableMonths);

        setSelectedMonth(
          res.data.currentMonth || availableMonths[0] || ''
        );
      }
    } catch (error) {
      console.error('Failed to load months:', error);
      showToast('Failed to load months', 'error');
    }
  };

  const loadFundData = async () => {
    try {
      setLoading(true);

      const [summaryRes, paymentsRes, expensesRes] =
        await Promise.all([
          api.get(`/summary/monthly?month=${selectedMonth}`),
          api.get(
            `/payments?month=${selectedMonth}&type=room_fund`
          ),
          api.get(`/expenses?month=${selectedMonth}`),
        ]);

      setSummary(summaryRes.data.roomSummary || {});

      setPayments(paymentsRes.data.payments || []);

      setExpenses(expensesRes.data.expenses || []);
    } catch (error) {
      console.error('Failed to load Room Fund:', error);

      showToast(
        error.response?.data?.message ||
          'Failed to load Room Fund data',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const totalFund = Number(summary?.totalRoomFund || 0);
  const usedFund = Number(summary?.usedRoomFund || 0);
  const remainingFund = Number(
    summary?.remainingRoomFund || 0
  );

  const pendingContributions = payments.filter(
    (payment) => payment.approvalStatus === 'pending'
  );

  const approvedContributions = payments.filter(
    (payment) =>
      payment.isApproved === true &&
      (
        payment.approvalStatus === 'approved' ||
        payment.approvalStatus === undefined
      )
  );

  const pendingFundExpenses = expenses.filter(
    (expense) =>
      expense.paymentSource === 'room_fund' &&
      expense.approvalStatus === 'pending'
  );

  const approvedFundExpenses = expenses.filter(
    (expense) =>
      expense.paymentSource === 'room_fund' &&
      (
        expense.approvalStatus === 'approved' ||
        expense.approvalStatus === undefined
      )
  );

  const money = (amount) =>
    `₹${Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleReviewContribution = async (
    paymentId,
    action
  ) => {
    let reason = '';

    if (action === 'reject') {
      reason = window.prompt(
        'Enter reason for rejecting this contribution:'
      );

      if (reason === null || !reason.trim()) {
        showToast(
          'Rejection reason is required',
          'error'
        );
        return;
      }
    }

    try {
      setActionLoading(true);

      await api.put(`/payments/${paymentId}/review`, {
        action,
        reason,
      });

      showToast(
        action === 'approve'
          ? 'Room Fund contribution approved'
          : 'Room Fund contribution rejected',
        'success'
      );

      await loadFundData();
    } catch (error) {
      showToast(
        error.response?.data?.message ||
          'Failed to review contribution',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewExpense = async (
    expenseId,
    action
  ) => {
    let reason = '';

    if (action === 'reject') {
      reason = window.prompt(
        'Enter reason for rejecting this expense request:'
      );

      if (reason === null || !reason.trim()) {
        showToast(
          'Rejection reason is required',
          'error'
        );
        return;
      }
    }

    try {
      setActionLoading(true);

      await api.put(`/expenses/${expenseId}/review`, {
        action,
        reason,
      });

      showToast(
        action === 'approve'
          ? 'Room Fund expense approved'
          : 'Room Fund expense rejected',
        'success'
      );

      await loadFundData();
    } catch (error) {
      showToast(
        error.response?.data?.message ||
          'Failed to review expense',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminContribution = async (event) => {
    event.preventDefault();

    const amount = Number(contributionAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      showToast('Enter a valid contribution amount', 'error');
      return;
    }

    try {
      setActionLoading(true);

      await api.post('/payments', {
        fromUser: user?.id || user?._id,
        amount,
        paymentType: 'room_fund',
        paymentMethod: 'cash',
        date: contributionDate,
        notes: 'Admin Room Fund contribution',
      });

      showToast(
        'Admin Room Fund contribution recorded',
        'success'
      );

      setContributionAmount('');

      await loadFundData();
    } catch (error) {
      showToast(
        error.response?.data?.message ||
          'Failed to record contribution',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddFundExpense = async (event) => {
    event.preventDefault();

    const amount = Number(expenseForm.amount);

    if (
      !expenseForm.title.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      showToast(
        'Enter an expense title and valid amount',
        'error'
      );
      return;
    }

    try {
      setActionLoading(true);

      const formData = new FormData();

      formData.append('title', expenseForm.title.trim());
      formData.append('amount', String(amount));
      formData.append('category', expenseForm.category);
      formData.append('date', expenseForm.date);
      formData.append(
        'description',
        expenseForm.description.trim()
      );
      formData.append('paidBy', 'ADMIN_FUND');
      formData.append('splitType', 'equal');

      await api.post('/expenses', formData);

      showToast(
        'Room Fund expense recorded successfully',
        'success'
      );

      setExpenseForm({
        title: '',
        amount: '',
        category: 'grocery',
        date: new Date().toISOString().slice(0, 10),
        description: '',
      });

      await loadFundData();
    } catch (error) {
      showToast(
        error.response?.data?.message ||
          'Failed to record Room Fund expense',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Room Fund Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Contributions, expense approvals and available balance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(event) =>
              setSelectedMonth(event.target.value)
            }
            className="rounded-lg border p-2"
          >
            {months.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={loadFundData}
            disabled={actionLoading}
            className="rounded-lg border p-2"
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Fund Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Room Fund"
          amount={money(totalFund)}
          icon={<Wallet className="h-6 w-6 text-blue-600" />}
          color="bg-blue-50"
        />

        <SummaryCard
          title="Used Room Fund"
          amount={money(usedFund)}
          icon={
            <TrendingDown className="h-6 w-6 text-red-600" />
          }
          color="bg-red-50"
        />

        <SummaryCard
          title="Available Room Fund"
          amount={money(remainingFund)}
          icon={
            <Banknote className="h-6 w-6 text-green-600" />
          }
          color="bg-green-50"
        />
      </div>

      {/* Admin contribution */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold">
          Admin Room Fund Contribution
        </h2>

        <form
          onSubmit={handleAdminContribution}
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          <input
            type="number"
            min="0.01"
            step="0.01"
            required
            value={contributionAmount}
            onChange={(event) =>
              setContributionAmount(event.target.value)
            }
            placeholder="Contribution amount"
            className="rounded-lg border p-3"
          />

          <input
            type="date"
            required
            value={contributionDate}
            onChange={(event) =>
              setContributionDate(event.target.value)
            }
            className="rounded-lg border p-3"
          />

          <button
            type="submit"
            disabled={actionLoading}
            className="rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            Add Admin Contribution
          </button>
        </form>
      </section>

      {/* Pending member contributions */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Clock className="h-5 w-5 text-amber-600" />
          Pending Room Fund Contributions
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3">Member</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Date</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {pendingContributions.map((payment) => (
                <tr key={payment._id} className="border-t">
                  <td className="p-3">
                    {payment.fromUser?.name || 'Member'}
                  </td>

                  <td className="p-3 font-semibold">
                    {money(payment.amount)}
                  </td>

                  <td className="p-3">
                    {payment.date
                      ? new Date(payment.date).toLocaleString()
                      : '-'}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() =>
                          handleReviewContribution(
                            payment._id,
                            'approve'
                          )
                        }
                        className="rounded-lg bg-green-600 px-3 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                
                      >
                        Approve
  
                      </button>

                     <button
                       type="button"
                       disabled={actionLoading}
                      onClick={() =>
                      handleReviewContribution(payment._id, 'reject')
                          }
                     className="rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                    Reject
                </button>
                    </div>
                  </td>
                </tr>
              ))}

              {pendingContributions.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-5 text-center text-slate-500"
                  >
                    No pending contributions for this month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pending Room Fund expense requests */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold">
          Pending Room Fund Expense Requests
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3">Expense</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Category</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {pendingFundExpenses.map((expense) => (
                <tr key={expense._id} className="border-t">
                  <td className="p-3">
                    {expense.title}
                  </td>

                  <td className="p-3 font-semibold">
                    {money(expense.amount)}
                  </td>

                  <td className="p-3">
                    {expense.category}
                  </td>

                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() =>
                          handleReviewExpense(
                            expense._id,
                            'approve'
                          )
                        }
                        className="rounded bg-green-600 p-2 text-white"
                        title="Approve"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() =>
                          handleReviewExpense(
                            expense._id,
                            'reject'
                          )
                        }
                        className="rounded bg-red-600 p-2 text-white"
                        title="Reject"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {pendingFundExpenses.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-5 text-center text-slate-500"
                  >
                    No pending Room Fund expense requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Room Fund expense */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <PlusCircle className="h-5 w-5 text-indigo-600" />
          Add Room Fund Expense
        </h2>

        <form
          onSubmit={handleAddFundExpense}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <input
            type="text"
            required
            value={expenseForm.title}
            onChange={(event) =>
              setExpenseForm({
                ...expenseForm,
                title: event.target.value,
              })
            }
            placeholder="Expense title (e.g. Grocery)"
            className="rounded-lg border p-3"
          />

          <input
            type="number"
            min="0.01"
            step="0.01"
            required
            value={expenseForm.amount}
            onChange={(event) =>
              setExpenseForm({
                ...expenseForm,
                amount: event.target.value,
              })
            }
            placeholder="Amount"
            className="rounded-lg border p-3"
          />

          <select
            value={expenseForm.category}
            onChange={(event) =>
              setExpenseForm({
                ...expenseForm,
                category: event.target.value,
              })
            }
            className="rounded-lg border p-3"
          >
            <option value="grocery">Grocery</option>
            <option value="electricity">Electricity</option>
            <option value="maintenance">Maintenance</option>
            <option value="restaurant">Restaurant</option>
            <option value="daily">Daily</option>
            <option value="other">Other</option>
          </select>

          <input
            type="date"
            required
            value={expenseForm.date}
            onChange={(event) =>
              setExpenseForm({
                ...expenseForm,
                date: event.target.value,
              })
            }
            className="rounded-lg border p-3"
          />

          <textarea
            value={expenseForm.description}
            onChange={(event) =>
              setExpenseForm({
                ...expenseForm,
                description: event.target.value,
              })
            }
            placeholder="Description (optional)"
            className="rounded-lg border p-3 sm:col-span-2"
          />

          <button
            type="submit"
            disabled={actionLoading}
            className="rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white disabled:opacity-50 sm:col-span-2"
          >
            Add Expense From Room Fund
          </button>
        </form>
      </section>

      {/* Fund history */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <History className="h-5 w-5 text-indigo-600" />
          Room Fund History
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3">Type</th>
                <th className="p-3">Description</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {[
                ...approvedContributions.map((payment) => ({
                  id: payment._id,
                  type: 'Contribution',
                  title:
                    payment.fromUser?.name ||
                    'Room Fund contribution',
                  amount: payment.amount,
                  date: payment.date,
                  status: 'Approved',
                })),

                ...approvedFundExpenses.map((expense) => ({
                  id: expense._id,
                  type: 'Expense',
                  title: expense.title,
                  amount: expense.amount,
                  date: expense.date,
                  status: 'Approved',
                })),
              ]
                .sort(
                  (a, b) =>
                    new Date(b.date || 0) -
                    new Date(a.date || 0)
                )
                .map((item) => (
                  <tr key={`${item.type}-${item.id}`} className="border-t">
                    <td className="p-3">{item.type}</td>
                    <td className="p-3">{item.title}</td>
                    <td className="p-3 font-semibold">
                      {money(item.amount)}
                    </td>
                    <td className="p-3">
                      {item.date
                        ? new Date(item.date).toLocaleString()
                        : '-'}
                    </td>
                    <td className="p-3 text-green-700">
                      {item.status}
                    </td>
                  </tr>
                ))}

              {approvedContributions.length === 0 &&
                approvedFundExpenses.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-5 text-center text-slate-500"
                    >
                      No Room Fund transactions found.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ title, amount, icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-xl p-3 ${color}`}>
          {icon}
        </div>

        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h2 className="text-2xl font-bold text-slate-800">
            {amount}
          </h2>
        </div>
      </div>
    </div>
  );
}
