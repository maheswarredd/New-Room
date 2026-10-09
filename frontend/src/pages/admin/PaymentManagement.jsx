import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ConfirmationModal from '../../components/ConfirmationModal';
import PhotoModal from '../../components/PhotoModal';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Trash2,
  Image,
  Calendar,
  CheckCircle,
  Clock,
  X,
  ArrowDownRight,
} from 'lucide-react';

export default function PaymentManagement() {
  const { user, showToast } = useAuth();
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedMember, setSelectedMember] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [photoViewer, setPhotoViewer] = useState({ isOpen: false, url: '', title: '' });

  // Form
  const [formData, setFormData] = useState({
    fromUser: '',
    amount: '',
    paymentType: 'rent',
    paymentMethod: 'upi',
    date: new Date().toISOString().split('T')[0],
    proofPhoto: '',
    notes: '',
  });
  const [fileToUpload, setFileToUpload] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchInitial();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [selectedMonth, selectedMember]);

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

  const fetchPayments = async () => {
    try {
      setLoading(true);
      let query = `?`;
      if (selectedMonth) query += `month=${selectedMonth}&`;
      if (selectedMember && selectedMember !== 'all') query += `memberId=${selectedMember}&`;

      const res = await api.get(`/payments${query}`);
      if (res.data.success) {
        setPayments(res.data.payments || []);
      }
    } catch (err) {
      showToast('Failed to load payments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      fromUser: members[0]?._id || '',
      amount: '',
      paymentType: 'rent',
      paymentMethod: 'upi',
      date: new Date().toISOString().split('T')[0],
      proofPhoto: '',
      notes: '',
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
      data.append('fromUser', formData.fromUser);
      data.append('amount', formData.amount);
      data.append('paymentType', formData.paymentType);
      data.append('paymentMethod', formData.paymentMethod);
      data.append('date', formData.date);
      data.append('notes', formData.notes);

      if (fileToUpload) {
        data.append('proof', fileToUpload);
      } else if (formData.proofPhoto) {
        data.append('proofPhoto', formData.proofPhoto);
      }

      const res = await api.post('/payments', data);
      if (res.data.success) {
        showToast('Payment recorded successfully', 'success');
        setIsAddModalOpen(false);
        fetchPayments();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to record payment', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setActionLoading(true);
      const res = await api.delete(`/payments/${paymentToDelete._id}`);
      if (res.data.success) {
        showToast('Payment record removed', 'success');
        setIsDeleteModalOpen(false);
        fetchPayments();
      }
    } catch (err) {
      showToast('Failed to delete payment', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payments & Dues</h1>
          <p className="text-sm text-slate-500 mt-1">
            Record direct member rent payments, settlements, and track payment receipts.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-100 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Payment</span>
        </button>
      </div>

      {/* Filter and stats */}
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
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Member</label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            >
              <option value="all">All Members</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} {m.roomNo ? `(Room ${m.roomNo})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <div className="bg-emerald-50 rounded-xl border border-emerald-200/60 p-2.5 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800">Total Recorded:</span>
              <span className="text-base font-extrabold text-emerald-700">₹{totalCollected.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Records Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No payment records</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              No payments found matching the selected filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Paid By Member</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4">Proof Receipt</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {payments.map((p) => {
                  const pDate = new Date(p.createdAt || p.date).toLocaleString('en-IN', {
                   day: '2-digit',
                   month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                 minute: '2-digit',
                 hour12: true,
                 });

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{pDate}</td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-[10px] font-bold flex items-center justify-center overflow-hidden">
                            {p.fromUser?.avatar ? (
                              <img src={p.fromUser.avatar} alt={p.fromUser.name} className="w-full h-full object-cover" />
                            ) : (
                              p.fromUser?.name?.charAt(0) || 'M'
                            )}
                          </div>
                          <span className="font-semibold text-slate-800">{p.fromUser?.name}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="capitalize text-[11px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                          {p.paymentType.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 uppercase font-semibold text-slate-600 text-[11px]">
                        {p.paymentMethod}
                      </td>

                      <td className="py-3.5 px-4 font-black text-emerald-700 text-sm">
                        ₹{p.amount.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                        {p.notes || '—'}
                      </td>

                      <td className="py-3.5 px-4">
                        {p.proofPhoto ? (
                          <button
                            onClick={() =>
                              setPhotoViewer({
                                isOpen: true,
                                url: p.proofPhoto,
                                title: `Payment Proof - ${p.fromUser?.name} (₹${p.amount})`,
                              })
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline"
                          >
                            <Image className="w-3.5 h-3.5" />
                            <span>View Proof</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setPaymentToDelete(p);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                          title="Delete Payment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Record Member Payment</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Paying Member *</label>
                <select
                  value={formData.fromUser}
                  onChange={(e) => setFormData({ ...formData, fromUser: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {members.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} {m.roomNo ? `(Room ${m.roomNo})` : ''}
                    </option>
                  ))}
                </select>
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
                    placeholder="e.g. 4500"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Type</label>
                  <select
                    value={formData.paymentType}
                    onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="rent">Monthly Rent</option>
                    <option value="expense_settlement">Expense Settlement</option>
                    <option value="fund_advance">Advance Fund</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="cash">Cash in Hand</option>
                    <option value="bank_transfer">Bank Transfer (IMPS/NEFT)</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Screenshot / Receipt</label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFileToUpload(e.target.files[0])}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <input
                    type="text"
                    value={formData.proofPhoto}
                    onChange={(e) => setFormData({ ...formData, proofPhoto: e.target.value })}
                    placeholder="Or paste screenshot image URL"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reference Notes / Txn ID</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. UPI Ref # 123456789012"
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
                  {actionLoading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Payment Record?"
        message={`Are you sure you want to delete payment of ₹${paymentToDelete?.amount} from ${paymentToDelete?.fromUser?.name}? This will affect their balance ledger.`}
        confirmText="Yes, Delete"
        loading={actionLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      {/* Proof Lightbox */}
      <PhotoModal
        isOpen={photoViewer.isOpen}
        photoUrl={photoViewer.url}
        title={photoViewer.title}
        onClose={() => setPhotoViewer({ isOpen: false, url: '', title: '' })}
      />
    </div>
  );
}
