import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ConfirmationModal from '../../components/ConfirmationModal';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  SlidersHorizontal,
  Mail,
  Phone,
  Home,
  DollarSign,
  Key,
  CheckCircle,
  XCircle,
  X,
  History,
  Wallet,
  RefreshCw,
} from 'lucide-react';

export default function MemberManagement() {
  const { showToast } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selected member for action
  const [selectedMember, setSelectedMember] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
  name: '',
  email: '',
  password: '',
  roomNo: '',
  phone: '',
  avatar: '',
  monthlyRentShare: 0,
  initialBalance: 0,
  accountBalance: 0,
  isActive: true,
});

  const [adjustData, setAdjustData] = useState({
    monthKey: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    adjustmentAmount: '',
    reason: '',
  });

  // Carryover Manager
const [isCarryoverManagerOpen, setIsCarryoverManagerOpen] =
  useState(false);

const [carryoverRows, setCarryoverRows] = useState([]);

const [carryoverLoading, setCarryoverLoading] = useState(false);

const [carryoverMonth, setCarryoverMonth] = useState(
  `${new Date().getFullYear()}-${String(
    new Date().getMonth() + 1
  ).padStart(2, '0')}`
);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/members');
      if (res.data.success) {
        setMembers(res.data.members || []);
      }
    } catch (err) {
      showToast('Failed to load members', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      roomNo: '',
      phone: '',
      avatar: '',
      monthlyRentShare: '',
      initialBalance: '',
      accountBalance: '',
      isActive: true,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (member) => {
    setSelectedMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      password: '', // leave empty unless resetting
      roomNo: member.roomNo || '',
      phone: member.phone || '',
      avatar: member.avatar || '',
      monthlyRentShare: member.monthlyRentShare || 0,
      initialBalance: member.initialBalance || 0,
      accountBalance: member.accountBalance ?? 0,
      isActive: member.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenAdjust = (member) => {
    setSelectedMember(member);
    setAdjustData({
      monthKey: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      adjustmentAmount: '',
      reason: '',
    });
    setIsAdjustModalOpen(true);
  };

  const handleOpenDelete = (member) => {
    setSelectedMember(member);
    setIsDeleteModalOpen(true);
  };

  // Submit Add
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await api.post('/members', formData);
      if (res.data.success) {
        showToast(res.data.message || 'Member created successfully', 'success');
        setIsAddModalOpen(false);
        fetchMembers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create member', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await api.put(`/members/${selectedMember._id}`, formData);
      if (res.data.success) {
        showToast(res.data.message || 'Member updated successfully', 'success');
        setIsEditModalOpen(false);
        fetchMembers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update member', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Adjust
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustData.adjustmentAmount || !adjustData.reason) {
      showToast('Adjustment amount and reason are required', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.post(`/members/${selectedMember._id}/adjust-balance`, adjustData);
      if (res.data.success) {
        showToast(res.data.message || 'Balance adjusted successfully', 'success');
        setIsAdjustModalOpen(false);
        fetchMembers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to adjust balance', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    try {
      setActionLoading(true);
      const res = await api.delete(`/members/${selectedMember._id}`);
      if (res.data.success) {
        showToast(res.data.message || 'Member deleted successfully', 'success');
        setIsDeleteModalOpen(false);
        fetchMembers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete member', 'error');
    } finally {
      setActionLoading(false);
    }
  };
  // Open carryover manager
const handleOpenCarryoverManager = async () => {
  setIsCarryoverManagerOpen(true);
  await fetchCarryoverRows();
};


// Load all members and their carryover information
const fetchCarryoverRows = async () => {
  try {
    setCarryoverLoading(true);

    const [carryoverRes, summaryRes] = await Promise.all([
      api.get(`/members/carryovers?monthKey=${carryoverMonth}`),
      api.get(`/summary/monthly?month=${carryoverMonth}`)
    ]);

    const ledgers = summaryRes.data.memberLedgers || [];

    const ledgerMap = new Map(
      ledgers.map((item) => [
        item.member.id.toString(),
        item
      ])
    );

    const rows = (carryoverRes.data.members || []).map((member) => {
      const ledger = ledgerMap.get(member._id.toString());

      return {
        ...member,
        carryForward: ledger?.carryForward ?? 0,
        netBalance: ledger?.netBalance ?? 0,
        carryoverAdjustment: member.carryoverAdjustment ?? 0
      };
    });

    setCarryoverRows(rows);

  } catch (error) {
    showToast(
      error.response?.data?.message ||
      'Failed to load carryover details',
      'error'
    );
  } finally {
    setCarryoverLoading(false);
  }
};


// Change individual carryover input
const handleCarryoverInputChange = (memberId, value) => {
  setCarryoverRows((prev) =>
    prev.map((member) =>
      member._id === memberId
        ? {
            ...member,
            carryoverAdjustment: value
          }
        : member
    )
  );
};


// Add / Edit carryover
const handleSaveCarryover = async (member) => {
  try {
    setActionLoading(true);

    const amount = Number(member.carryoverAdjustment);

    if (!Number.isFinite(amount)) {
      showToast('Enter a valid carryover amount', 'error');
      return;
    }

    const res = await api.put(
      `/members/${member._id}/carryover`,
      {
        monthKey: carryoverMonth,
        adjustmentAmount: amount,
        reason: 'Admin managed carryover'
      }
    );

    if (res.data.success) {
      showToast('Carryover saved successfully', 'success');
      await fetchCarryoverRows();
      await fetchMembers();
    }

  } catch (error) {
    showToast(
      error.response?.data?.message || 'Failed to save carryover',
      'error'
    );
  } finally {
    setActionLoading(false);
  }
};


// Remove carryover adjustment
const handleRemoveCarryover = async (member) => {
  if (!window.confirm(
    `Remove carryover adjustment for ${member.name}?`
  )) return;

  try {
    setActionLoading(true);

    await api.delete(
      `/members/${member._id}/carryover?monthKey=${carryoverMonth}`
    );

    showToast('Carryover adjustment removed', 'success');

    await fetchCarryoverRows();

  } catch (error) {
    showToast(
      error.response?.data?.message || 'Failed to remove carryover',
      'error'
    );
  } finally {
    setActionLoading(false);
  }
};


// Reset one member carryover to zero
const handleResetMemberCarryover = async (member) => {
  if (!window.confirm(
    `Are you sure you want to reset ${member.name}'s carryover to ₹0?`
  )) return;

  try {
    setActionLoading(true);

    const res = await api.post(
      `/members/${member._id}/carryover/reset`,
      {
        monthKey: carryoverMonth
      }
    );

    if (res.data.success) {
      showToast(res.data.message, 'success');

      await fetchCarryoverRows();
      await fetchMembers();
    }

  } catch (error) {
    showToast(
      error.response?.data?.message || 'Failed to reset carryover',
      'error'
    );
  } finally {
    setActionLoading(false);
  }
};

  const filteredMembers = members.filter((m) => {
    const q = searchTerm.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.roomNo?.toLowerCase().includes(q) ||
      m.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Room Members Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create member credentials, adjust rent shares, and manage balances. Members cannot self-register.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCarryoverManager}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition"
          >
            <Wallet className="w-4 h-4" />
            <span>Carryover Manager</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-100 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Member</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search member by name, room number, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500 self-center px-2">
          Total: {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
        </div>
      </div>

      {/* Member Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No members found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            {searchTerm ? 'Try searching with a different keyword.' : 'Get started by creating your first room member account.'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow hover:bg-indigo-700 transition"
            >
              Add First Member
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers.map((member) => (
            <div
              key={member._id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center font-extrabold text-slate-700 text-lg overflow-hidden shadow-inner">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        member.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                        {member.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            member.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {member.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {member.isActive ? 'Active' : 'Disabled'}
                        </span>
                        {member.roomNo && (
                          <span className="text-[11px] font-semibold text-slate-500">
                            Room {member.roomNo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(member)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition"
                      title="Edit Member"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(member)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                      title="Delete Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details list */}
                <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-400">Monthly Rent Share:</span>
                    <span className="font-bold text-slate-800">
                      ₹{member.monthlyRentShare || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
  <span className="text-slate-400">Initial / Carried Balance:</span>

  <span className={`font-bold ${
    Number(member.initialBalance || 0) >= 0
      ? 'text-emerald-700'
      : 'text-rose-700'
  }`}>
    {Number(member.initialBalance || 0) >= 0
      ? `+₹${Number(member.initialBalance || 0).toLocaleString('en-IN')}`
      : `-₹${Math.abs(Number(member.initialBalance || 0)).toLocaleString('en-IN')}`}
  </span>
</div>

{/* Account Balance */}
<div className="flex items-center justify-between pt-2 border-t border-slate-100">

  <span className="text-slate-500 flex items-center gap-1">
    <Wallet className="w-3.5 h-3.5" />
    Account Balance:
  </span>

  <span className={`font-black ${
    Number(member.accountBalance || 0) >= 0
      ? 'text-emerald-700'
      : 'text-rose-700'
  }`}>
    ₹{Number(member.accountBalance || 0).toLocaleString('en-IN')}
  </span>

</div>
                  
                </div>
              </div>

              {/* Action footer */}
              <div className="mt-5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleOpenAdjust(member)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-bold border border-slate-200 transition flex items-center justify-center gap-2"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Adjust Balance / Carryover</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create New Member</h3>
                <p className="text-xs text-slate-500">Only Admin can create room member accounts</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email / Login Username *</label>
                <input
                  type="text"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. ramesh@roommate.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Login Password * (Min 6 chars)</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Provide secure member password"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Room No. / Bed</label>
                  <input
                    type="text"
                    value={formData.roomNo}
                    onChange={(e) => setFormData({ ...formData, roomNo: e.target.value })}
                    placeholder="e.g. 201-B"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +91 9876543210"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Rent Share (₹)</label>
                  <input
                    type="number"
                    value={formData.monthlyRentShare}
                    onChange={(e) => setFormData({ ...formData, monthlyRentShare: e.target.value })}
                    placeholder="e.g. 4500"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Balance (₹)</label>
                  <input
                    type="number"
                    value={formData.initialBalance}
                    onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
                    placeholder="e.g. 0 or -1000 if due"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Profile Photo (URL)</label>
                <input
                  type="text"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  placeholder="https://images.unsplash.com/... or leave blank"
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
                  {actionLoading ? 'Creating...' : 'Create Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Member Profile</h3>
                <p className="text-xs text-slate-500">Updating: {selectedMember?.name}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email / Username</label>
                <input
                  type="text"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reset Password (Leave blank to keep unchanged)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="New password (min 6 chars)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Room No.</label>
                  <input
                    type="text"
                    value={formData.roomNo}
                    onChange={(e) => setFormData({ ...formData, roomNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

             <div className="grid grid-cols-2 gap-3">
  <div>
    <label className="block font-bold text-slate-700 mb-1">
      Monthly Rent Share (₹)
    </label>
    <input
      type="number"
      min="0"
      value={formData.monthlyRentShare}
      onChange={(e) =>
        setFormData({ ...formData, monthlyRentShare: e.target.value })
      }
      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  </div>

  <div>
    <label className="block font-bold text-slate-700 mb-1">
      Account Status
    </label>
    <select
      value={formData.isActive ? 'true' : 'false'}
      onChange={(e) =>
        setFormData({
          ...formData,
          isActive: e.target.value === 'true',
        })
      }
      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <option value="true">Active (Can Login)</option>
      <option value="false">Disabled (Blocked)</option>
    </select>
  </div>
</div>

{/* Account Balance */}
<div>
  <label className="block font-bold text-slate-700 mb-1">
    Account Balance (₹)
  </label>
  <input
    type="number"
    step="0.01"
    value={formData.accountBalance}
    onChange={(e) =>
      setFormData({ ...formData, accountBalance: e.target.value })
    }
    placeholder="Enter account balance"
    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
  />
  <p className="text-[11px] text-slate-400 mt-1">
    Admin only: Update this member's account balance.
  </p>
</div>
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-100 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Balance / Carry Forward Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Adjust Balance / Carryover</h3>
                <p className="text-xs text-slate-500">For member: <span className="font-bold text-slate-700">{selectedMember?.name}</span></p>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Month (YYYY-MM)</label>
                <input
                  type="text"
                  required
                  value={adjustData.monthKey}
                  onChange={(e) => setAdjustData({ ...adjustData, monthKey: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Adjustment Amount (₹)
                </label>
                <p className="text-[11px] text-slate-400 mb-1">
                  Use positive (e.g. 500) to credit/reduce dues, or negative (e.g. -500) to add dues/penalty.
                </p>
                <input
                  type="number"
                  step="any"
                  required
                  value={adjustData.adjustmentAmount}
                  onChange={(e) => setAdjustData({ ...adjustData, adjustmentAmount: e.target.value })}
                  placeholder="e.g. 350 or -200"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason / Explanation *</label>
                <textarea
                  rows="3"
                  required
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                  placeholder="e.g. Corrected previous month grocery calculation error or security deposit refund"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-100 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Carryover Manager Modal */}
      {isCarryoverManagerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">Member Carryover Manager</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Add, edit, remove or reset each member's carryover for the selected month.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCarryoverManagerOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                aria-label="Close carryover manager"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="w-full sm:w-56">
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Month</label>
                <input
                  type="month"
                  value={carryoverMonth}
                  onChange={(e) => setCarryoverMonth(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={fetchCarryoverRows}
                disabled={carryoverLoading || !carryoverMonth}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${carryoverLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="overflow-auto flex-1 p-4">
              {carryoverLoading ? (
                <div className="py-12 text-center text-sm text-slate-500">Loading member carryovers...</div>
              ) : carryoverRows.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">No member carryover records found.</div>
              ) : (
                <div className="min-w-[760px]">
                  <div className="grid grid-cols-[1.3fr_0.8fr_0.8fr_1.1fr] gap-3 px-3 py-2 text-[11px] uppercase tracking-wide font-black text-slate-500">
                    <span>Member</span>
                    <span>Carry Forward</span>
                    <span>Net Balance</span>
                    <span>Manage Carryover (₹)</span>
                  </div>
                  <div className="space-y-2">
                    {carryoverRows.map((member) => (
                      <div
                        key={member._id}
                        className="grid grid-cols-[1.3fr_0.8fr_0.8fr_1.1fr] gap-3 items-center p-3 rounded-xl border border-slate-100 bg-slate-50"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-800 truncate">{member.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {member.roomNo ? `Room ${member.roomNo} · ` : ''}{member.email}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-slate-700">
                          ₹{Number(member.carryForward || 0).toLocaleString('en-IN')}
                        </span>
                        <span className={`text-sm font-bold ${Number(member.netBalance || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          ₹{Number(member.netBalance || 0).toLocaleString('en-IN')}
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={member.carryoverAdjustment ?? ''}
                            onChange={(e) => handleCarryoverInputChange(member._id, e.target.value)}
                            aria-label={`Carryover amount for ${member.name}`}
                            className="min-w-0 w-full px-2 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveCarryover(member)}
                            disabled={actionLoading}
                            title="Save carryover"
                            className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveCarryover(member)}
                            disabled={actionLoading}
                            title="Remove adjustment"
                            className="p-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetMemberCarryover(member)}
                            disabled={actionLoading}
                            title="Reset carryover to zero"
                            className="p-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 disabled:opacity-50"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCarryoverManagerOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title={`Remove Member: ${selectedMember?.name}?`}
        message="Are you sure you want to remove this member? This will dissociate their pending tasks. Past transaction records will be preserved."
        confirmText="Yes, Remove Member"
        loading={actionLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
