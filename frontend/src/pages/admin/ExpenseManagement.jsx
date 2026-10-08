import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ConfirmationModal from '../../components/ConfirmationModal';
import PhotoModal from '../../components/PhotoModal';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Calendar,
  Image,
  Edit2,
  Trash2,
  ExternalLink,
  Users,
  X,
  FileText,
} from 'lucide-react';

export default function ExpenseManagement() {
  const { user, showToast } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPaidBy, setSelectedPaidBy] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [months, setMonths] = useState([]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Photo Lightbox
  const [photoViewer, setPhotoViewer] = useState({ isOpen: false, url: '', title: '' });

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'grocery',
    date: new Date().toISOString().split('T')[0],
    paidBy: '',
    splitType: 'equal',
    description: '',
    receiptPhoto: '',
  });
  const [customSplits, setCustomSplits] = useState([]);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchInitial();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [selectedMonth, selectedCategory, selectedPaidBy, searchQuery]);

  const fetchInitial = async () => {
    try {
      const [mRes, memRes] = await Promise.all([
        api.get('/summary/months'),
        api.get('/members'),
      ]);

      if (mRes.data.success) {
        setMonths(mRes.data.months || []);
        setSelectedMonth(mRes.data.currentMonth || mRes.data.months[0]);
      }

      if (memRes.data.success) {
        setMembers(memRes.data.members || []);
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
      if (selectedPaidBy && selectedPaidBy !== 'all') query += `paidBy=${selectedPaidBy}&`;
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
      paidBy: members[0]?._id || user?.id,
      splitType: 'equal',
      description: '',
      receiptPhoto: '',
    });
    setFileToUpload(null);
    setCustomSplits(
      members.map((m) => ({
        user: m._id,
        name: m.name,
        amount: 0,
      }))
    );
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (expense) => {
    setSelectedExpense(expense);
    setFormData({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: new Date(expense.date).toISOString().split('T')[0],
      paidBy: expense.paidBy?._id || expense.paidBy,
      splitType: expense.splitType || 'equal',
      description: expense.description || '',
      receiptPhoto: expense.receiptPhoto || '',
    });
    setFileToUpload(null);

    // populate custom splits
    const splits = members.map((m) => {
      const match = expense.splitAmong?.find((s) => s.user?._id === m._id || s.user === m._id);
      return {
        user: m._id,
        name: m.name,
        amount: match ? match.amount : 0,
      };
    });
    setCustomSplits(splits);

    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (expense) => {
    setSelectedExpense(expense);
    setIsDeleteModalOpen(true);
  };

  // Save Add
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showToast('Please provide a valid expense amount', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const data = new FormData();
      data.append('title', formData.title);
      data.append('amount', formData.amount);
      data.append('category', formData.category);
      data.append('date', formData.date);
      data.append('paidBy', formData.paidBy || user?.id);
      data.append('splitType', formData.splitType);
      data.append('description', formData.description);

      if (formData.splitType === 'custom') {
        data.append('splitAmong', JSON.stringify(customSplits.map((s) => ({ user: s.user, amount: Number(s.amount) || 0 }))));
      }

      if (fileToUpload) {
        data.append('receipt', fileToUpload);
      } else if (formData.receiptPhoto) {
        data.append('receiptPhoto', formData.receiptPhoto);
      }

      const res = await api.post('/expenses', data);
      if (res.data.success) {
        showToast('Expense recorded successfully', 'success');
        setIsAddModalOpen(false);
        fetchExpenses();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add expense', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Save Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const data = new FormData();
      data.append('title', formData.title);
      data.append('amount', formData.amount);
      data.append('category', formData.category);
      data.append('date', formData.date);
      data.append('paidBy', formData.paidBy);
      data.append('splitType', formData.splitType);
      data.append('description', formData.description);

      if (formData.splitType === 'custom') {
        data.append('splitAmong', JSON.stringify(customSplits.map((s) => ({ user: s.user, amount: Number(s.amount) || 0 }))));
      }

      if (fileToUpload) {
        data.append('receipt', fileToUpload);
      } else if (formData.receiptPhoto !== undefined) {
        data.append('receiptPhoto', formData.receiptPhoto);
      }

      const res = await api.put(`/expenses/${selectedExpense._id}`, data);
      if (res.data.success) {
        showToast('Expense updated successfully', 'success');
        setIsEditModalOpen(false);
        fetchExpenses();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update expense', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    try {
      setActionLoading(true);
      const res = await api.delete(`/expenses/${selectedExpense._id}`);
      if (res.data.success) {
        showToast('Expense deleted successfully', 'success');
        setIsDeleteModalOpen(false);
        fetchExpenses();
      }
    } catch (err) {
      showToast('Failed to delete expense', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const categoryLabels = {
    all: 'All Categories',
    rent: 'Room Rent',
    grocery: 'Kitchen & Grocery',
    electricity: 'Electricity Bill',
    restaurant: 'Outside Food',
    daily: 'Daily Expenses',
    maintenance: 'Maintenance',
    other: 'Other Misc',
  };

  const categoryBadgeColors = {
    rent: 'bg-purple-100 text-purple-800 border-purple-200',
    grocery: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    electricity: 'bg-amber-100 text-amber-800 border-amber-200',
    restaurant: 'bg-orange-100 text-orange-800 border-orange-200',
    daily: 'bg-blue-100 text-blue-800 border-blue-200',
    maintenance: 'bg-rose-100 text-rose-800 border-rose-200',
    other: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  const totalFilteredAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Room Expenses</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track daily groceries, rent, utility bills, outside food, and auto-split among members.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-100 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Month selector */}
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

          {/* Category filter */}
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

          {/* Paid By filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Paid By</label>
            <select
              value={selectedPaidBy}
              onChange={(e) => setSelectedPaidBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            >
              <option value="all">Anyone</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search bar */}
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

        {/* Aggregate sum badge */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>Found {expenses.length} transaction records</span>
          <div className="text-right">
            <span>Total: </span>
            <span className="font-extrabold text-base text-slate-900">₹{totalFilteredAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Expenses List / Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No expenses recorded</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              No transactions match your current filters. Click "Add Expense" to record a new room purchase.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Title & Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Paid By</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Split Detail</th>
                  <th className="py-3 px-4">Bill Photo</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {expenses.map((expense) => {
                  const expenseDate = new Date(expense.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr key={expense._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {expenseDate}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{expense.title}</div>
                        {expense.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {expense.description}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            categoryBadgeColors[expense.category] || 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {categoryLabels[expense.category] || expense.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-[10px] font-bold flex items-center justify-center overflow-hidden">
                            {expense.paidBy?.avatar ? (
                              <img
                                src={expense.paidBy.avatar}
                                alt={expense.paidBy.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              expense.paidBy?.name?.charAt(0) || 'P'
                            )}
                          </div>
                          <span className="font-semibold text-slate-800">
                            {expense.paidBy?.name || 'Admin'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-sm text-slate-900">
                          ₹{expense.amount.toLocaleString()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {expense.splitType === 'equal' ? (
                          <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                            Equally split
                          </span>
                        ) : (
                          <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-semibold">
                            Custom split ({expense.splitAmong?.length} members)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
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
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(expense)}
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(expense)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {isAddModalOpen ? 'Record Room Expense' : 'Edit Expense Details'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit}
              className="mt-4 space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Expense Title / Item Name *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Weekly Groceries, Electricity Bill, Dining Out"
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
                    placeholder="e.g. 1450"
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
                    <option value="rent">Room Rent</option>
                    <option value="restaurant">Outside Restaurant</option>
                    <option value="daily">Daily Expenses</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="other">Other Misc</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Transaction Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Who Paid for this? *</label>
                  <select
                    value={formData.paidBy}
                    onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {members.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} {m.roomNo ? `(Room ${m.roomNo})` : ''}
                      </option>
                    ))}
                    {user?.role === 'admin' && (
                      <option value={user.id}>Admin / Room Common Fund</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Splitting method */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Expense Split Type</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, splitType: 'equal' })}
                    className={`py-2 px-3 rounded-xl border font-bold text-center transition ${
                      formData.splitType === 'equal'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Equal Split (All Members)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, splitType: 'custom' })}
                    className={`py-2 px-3 rounded-xl border font-bold text-center transition ${
                      formData.splitType === 'custom'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Custom Member Amounts
                  </button>
                </div>

                {formData.splitType === 'custom' && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 mt-2">
                    <p className="text-[11px] font-bold text-slate-500">
                      Specify exact share for each room member:
                    </p>
                    {customSplits.map((item, idx) => (
                      <div key={item.user} className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-700 truncate">{item.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">₹</span>
                          <input
                            type="number"
                            value={item.amount}
                            onChange={(e) => {
                              const updated = [...customSplits];
                              updated[idx].amount = e.target.value;
                              setCustomSplits(updated);
                            }}
                            className="w-24 px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Receipt / Bill Photo</label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFileToUpload(e.target.files[0])}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <input
                    type="text"
                    value={formData.receiptPhoto}
                    onChange={(e) => setFormData({ ...formData, receiptPhoto: e.target.value })}
                    placeholder="Or paste receipt image URL (e.g. https://...)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional notes regarding this purchase"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-100 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : isAddModalOpen ? 'Save Expense' : 'Update Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Expense?"
        message={`Are you sure you want to delete "${selectedExpense?.title}" (₹${selectedExpense?.amount})? This will automatically recalculate all members' balance shares.`}
        confirmText="Yes, Delete"
        loading={actionLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      {/* Photo Lightbox */}
      <PhotoModal
        isOpen={photoViewer.isOpen}
        photoUrl={photoViewer.url}
        title={photoViewer.title}
        onClose={() => setPhotoViewer({ isOpen: false, url: '', title: '' })}
      />
    </div>
  );
}
