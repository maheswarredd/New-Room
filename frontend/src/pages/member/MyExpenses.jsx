import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PhotoModal from '../../components/PhotoModal';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Calendar,
  Image,
  X,
  CreditCard,
} from 'lucide-react';

export default function MyExpenses() {
  const { user, showToast } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Add Expense Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'grocery',
    date: new Date().toISOString().split('T')[0],
    description: '',
    receiptPhoto: '',
  });
  const [fileToUpload, setFileToUpload] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [photoViewer, setPhotoViewer] = useState({ isOpen: false, url: '', title: '' });

  useEffect(() => {
    fetchInitial();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [selectedMonth, selectedCategory, searchQuery]);

  const fetchInitial = async () => {
    try {
      const res = await api.get('/summary/months');
      if (res.data.success) {
        setMonths(res.data.months || []);
        setSelectedMonth(res.data.currentMonth || res.data.months[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      let query = `?`;
      if (selectedMonth) query += `month=${selectedMonth}&`;
      if (selectedCategory && selectedCategory !== 'all') query += `category=${selectedCategory}&`;
      if (searchQuery) query += `search=${encodeURIComponent(searchQuery)}&`;

      const res = await api.get(`/expenses${query}`);
      if (res.data.success) {
        setExpenses(res.data.expenses || []);
      }
    } catch (err) {
      showToast('Error loading expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      title: '',
      amount: '',
      category: 'grocery',
      date: new Date().toISOString().split('T')[0],
      description: '',
      receiptPhoto: '',
    });
    setFileToUpload(null);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showToast('Please provide a valid amount', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const data = new FormData();
      data.append('title', formData.title);
      data.append('amount', formData.amount);
      data.append('category', formData.category);
      data.append('date', formData.date);
      data.append('description', formData.description);
      data.append('paidBy', user.id);
      data.append('splitType', 'equal');

      if (fileToUpload) {
        data.append('receipt', fileToUpload);
      } else if (formData.receiptPhoto) {
        data.append('receiptPhoto', formData.receiptPhoto);
      }

      const res = await api.post('/expenses', data);
      if (res.data.success) {
        showToast('Expense recorded successfully! Balances updated.', 'success');
        setIsAddModalOpen(false);
        fetchExpenses();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add expense', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const categoryLabels = {
    rent: 'Room Rent',
    grocery: 'Kitchen & Grocery',
    electricity: 'Electricity Bill',
    restaurant: 'Outside Food',
    daily: 'Daily Expenses',
    maintenance: 'Maintenance',
    other: 'Other Misc',
  };

  const totalFilteredAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Room Expenses</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse expenses recorded by all room members and log purchases you paid for.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-100 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>I Paid an Expense</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            >
              <option value="">All Time</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            >
              <option value="all">All Categories</option>
              <option value="rent">Room Rent</option>
              <option value="grocery">Kitchen & Grocery</option>
              <option value="electricity">Electricity Bill</option>
              <option value="restaurant">Outside Restaurant</option>
              <option value="daily">Daily Expenses</option>
              <option value="maintenance">Maintenance</option>
              <option value="other">Other Misc</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>{expenses.length} expenses logged</span>
          <span className="font-extrabold text-sm text-slate-900">Total: ₹{totalFilteredAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Receipt className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-700">No expenses recorded</p>
            <p className="text-xs text-slate-400 mt-1">Try changing filters or add a new purchase.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Item & Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Paid By</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Receipt</th>
                  <th className="py-3 px-4">Approval Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {expenses.map((expense) => {
                  const isPaidByMe = expense.paidBy?._id === user?.id;
                  return (
                    <tr key={expense._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(expense.createdAt || expense.date).toLocaleString('en-IN', {
                         day: '2-digit',
                         month: 'short',
                         year: 'numeric',
                         hour: '2-digit',
                         minute: '2-digit',
                         hour12: true,
                         })}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{expense.title}</span>
                        {expense.description && (
                          <span className="text-[11px] text-slate-500 block truncate max-w-xs">
                            {expense.description}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="capitalize px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {categoryLabels[expense.category] || expense.category}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold ${
                            isPaidByMe ? 'text-indigo-600 font-bold' : 'text-slate-700'
                          }`}
                        >
                          {isPaidByMe ? 'You' : expense.paidBy?.name || 'Admin'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-black text-slate-900 text-sm">
                        ₹{expense.amount.toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        {expense.receiptPhoto ? (
                          <button
                            onClick={() =>
                              setPhotoViewer({
                                isOpen: true,
                                url: expense.receiptPhoto,
                                title: `Receipt for ${expense.title}`,
                              })
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline"
                          >
                            <Image className="w-3.5 h-3.5" />
                            <span>View Bill</span>
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                      <span>
                      {(expense.approvalStatus || 'approved').toUpperCase()}
                      </span>

                      {expense.rejectionReason && (
                      <p className="text-[10px] text-rose-600 mt-1">
                       Reason: {expense.rejectionReason}
                       </p>
                       )}
                     </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Record Expense You Paid</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Item / Expense Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Milk & Eggs, Cooking Oil, Wi-Fi Recharge"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="e.g. 520"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="grocery">Kitchen & Grocery</option>
                    <option value="electricity">Electricity Bill</option>
                    <option value="restaurant">Outside Restaurant</option>
                    <option value="daily">Daily Expenses</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="other">Other Misc</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bill / Receipt Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFileToUpload(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional details..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-100 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Recording...' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      <PhotoModal
        isOpen={photoViewer.isOpen}
        photoUrl={photoViewer.url}
        title={photoViewer.title}
        onClose={() => setPhotoViewer({ isOpen: false, url: '', title: '' })}
      />
    </div>
  );
}
