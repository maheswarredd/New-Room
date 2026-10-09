import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PhotoModal from '../../components/PhotoModal';
import {
  CreditCard,
  Plus,
  Calendar,
  Image,
  CheckCircle,
  X,
  ArrowUpRight,
} from 'lucide-react';

export default function MyPayments() {
  const { user, showToast } = useAuth();
  const [payments, setPayments] = useState([]);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(true);

  // Record payment modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    paymentType: 'rent',
    paymentMethod: 'upi',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    proofPhoto: '',
  });
  const [fileToUpload, setFileToUpload] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [photoViewer, setPhotoViewer] = useState({ isOpen: false, url: '', title: '' });

  useEffect(() => {
    fetchInitial();
  }, []);

  useEffect(() => {
    fetchMyPayments();
  }, [selectedMonth]);

  const fetchInitial = async () => {
    try {
      const res = await api.get('/summary/months');
      if (res.data.success) {
        setMonths(res.data.months || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyPayments = async () => {
    try {
      setLoading(true);
      let query = `?`;
      if (selectedMonth) query += `month=${selectedMonth}&`;
      const res = await api.get(`/payments${query}`);
      if (res.data.success) {
        setPayments(res.data.payments || []);
      }
    } catch (err) {
      showToast('Error loading payment history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      amount: '',
      paymentType: 'rent',
      paymentMethod: 'upi',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      proofPhoto: '',
    });
    setFileToUpload(null);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showToast('Please specify a valid payment amount', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const data = new FormData();
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
        showToast('Payment submitted successfully', 'success');
        setIsAddModalOpen(false);
        fetchMyPayments();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit payment', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Payments & Transfers</h1>
          <p className="text-sm text-slate-500 mt-1">
            History of rent transfers and expense settlements you paid to the Room Admin.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-100 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Payment</span>
        </button>
      </div>

      {/* Filter and stats */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500">Filter Month:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50/50"
          >
            <option value="">All Time</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs font-semibold text-slate-600 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
          Total Paid: <span className="font-extrabold text-sm text-emerald-700">₹{totalPaid.toLocaleString()}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CreditCard className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-700">No payment records found</p>
            <p className="text-xs text-slate-400 mt-1">Submit your rent or settlement proof when paid.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Payment Type</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Notes / Txn Ref</th>
                  <th className="py-3 px-4">Proof Receipt</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(p.createdAt || p.date).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                       minute: '2-digit',
                       hour12: true,
                       })}
                    </td>
                    <td className="py-3 px-4 capitalize font-semibold text-slate-800">
                      {p.paymentType.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 uppercase font-bold text-slate-600 text-[11px]">
                      {p.paymentMethod}
                    </td>
                    <td className="py-3 px-4 font-black text-emerald-700 text-sm">
                      ₹{p.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {p.notes || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {p.proofPhoto ? (
                        <button
                          onClick={() =>
                            setPhotoViewer({
                              isOpen: true,
                              url: p.proofPhoto,
                              title: `Payment Proof - ₹${p.amount}`,
                            })
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline"
                        >
                          <Image className="w-3.5 h-3.5" />
                          <span>View Proof</span>
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      (p.approvalStatus || (p.isApproved === false ? 'pending' : 'approved')) === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : (p.approvalStatus || (p.isApproved === false ? 'pending' : 'approved')) === 'rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                      }`}
                      >
                      <CheckCircle className="w-3 h-3" />
                     {(p.approvalStatus || (p.isApproved === false ? 'pending' : 'approved')).toUpperCase()}
                     </span>

                    {p.rejectionReason && (
                    <p className="text-[10px] text-rose-600 mt-1">
                    {p.rejectionReason}
                    </p>
                    )}
                    </td>
                  </tr>
                ))}
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
              <h3 className="text-lg font-bold text-slate-900">Record Settlement Payment</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4 text-xs">
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
                  <label className="block font-bold text-slate-700 mb-1">Date *</label>
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
                  <label className="block font-bold text-slate-700 mb-1">Type</label>
                  <select
                    value={formData.paymentType}
                    onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="rent">Room Rent</option>
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
                    <option value="upi">UPI (GPay, PhonePe, Paytm)</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">UPI Screenshot / Receipt Proof</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFileToUpload(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / UPI Reference Number</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Paid to Admin via Google Pay (Ref 998811)"
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
                  {actionLoading ? 'Submitting...' : 'Submit Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proof Viewer Modal */}
      <PhotoModal
        isOpen={photoViewer.isOpen}
        photoUrl={photoViewer.url}
        title={photoViewer.title}
        onClose={() => setPhotoViewer({ isOpen: false, url: '', title: '' })}
      />
    </div>
  );
}
