import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ConfirmationModal from '../../components/ConfirmationModal';
import PhotoModal from '../../components/PhotoModal';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Image,
  Edit2,
  Trash2,
  Users,
  History,
  X,
  ArrowRight,
} from 'lucide-react';

export default function TaskManager() {
  const { user, showToast } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, in_progress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [photoViewer, setPhotoViewer] = useState({ isOpen: false, url: '', title: '' });

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: [],
    priority: 'medium',
    status: 'pending',
    assignedDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    photo: '',
  });
  const [fileToUpload, setFileToUpload] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter, memberFilter, searchQuery]);

  const fetchMembers = async () => {
    try {
      const res = await api.get('/members');
      if (res.data.success) {
        setMembers(res.data.members || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let query = `?`;
      if (statusFilter && statusFilter !== 'all') query += `status=${statusFilter}&`;
      if (priorityFilter && priorityFilter !== 'all') query += `priority=${priorityFilter}&`;
      if (memberFilter && memberFilter !== 'all') query += `memberId=${memberFilter}&`;
      if (searchQuery) query += `search=${encodeURIComponent(searchQuery)}&`;

      const res = await api.get(`/tasks${query}`);
      if (res.data.success) {
        setTasks(res.data.tasks || []);
        if (res.data.counts) setCounts(res.data.counts);
      }
    } catch (err) {
      showToast('Failed to load pending works', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      description: '',
      assignedTo: members[0]?._id ? [members[0]._id] : [],
      priority: 'medium',
      status: 'pending',
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      photo: '',
    });
    setFileToUpload(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo?.map((m) => m._id) || [],
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      assignedDate: task.assignedDate ? new Date(task.assignedDate).toISOString().split('T')[0] : '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      photo: task.photo || '',
    });
    setFileToUpload(null);
    setIsEditModalOpen(true);
  };

  const handleToggleAssignee = (memberId) => {
    setFormData((prev) => {
      const exists = prev.assignedTo.includes(memberId);
      if (exists) {
        return { ...prev, assignedTo: prev.assignedTo.filter((id) => id !== memberId) };
      } else {
        return { ...prev, assignedTo: [...prev.assignedTo, memberId] };
      }
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      showToast('Title and description are required', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('priority', formData.priority);
      data.append('assignedDate', formData.assignedDate);
      if (formData.dueDate) data.append('dueDate', formData.dueDate);

      formData.assignedTo.forEach((mId) => {
        data.append('assignedTo', mId);
      });

      if (fileToUpload) {
        data.append('photo', fileToUpload);
      } else if (formData.photo) {
        data.append('photo', formData.photo);
      }

      const res = await api.post('/tasks', data);
      if (res.data.success) {
        showToast('Pending work assigned successfully', 'success');
        setIsCreateModalOpen(false);
        fetchTasks();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create work item', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('priority', formData.priority);
      data.append('status', formData.status);
      data.append('assignedDate', formData.assignedDate);
      if (formData.dueDate) data.append('dueDate', formData.dueDate);

      formData.assignedTo.forEach((mId) => {
        data.append('assignedTo', mId);
      });

      if (fileToUpload) {
        data.append('photo', fileToUpload);
      } else if (formData.photo !== undefined) {
        data.append('photo', formData.photo);
      }

      const res = await api.put(`/tasks/${selectedTask._id}`, data);
      if (res.data.success) {
        showToast('Work details updated', 'success');
        setIsEditModalOpen(false);
        fetchTasks();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update task', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChangeQuick = async (taskId, newStatus) => {
    try {
      const res = await api.patch(`/tasks/${taskId}/status`, {
        status: newStatus,
        note: `Status updated by Admin to ${newStatus}`,
      });
      if (res.data.success) {
        showToast(`Status updated to ${newStatus.replace('_', ' ')}`, 'success');
        fetchTasks();
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setActionLoading(true);
      const res = await api.delete(`/tasks/${selectedTask._id}`);
      if (res.data.success) {
        showToast('Pending work removed', 'success');
        setIsDeleteModalOpen(false);
        fetchTasks();
      }
    } catch (err) {
      showToast('Failed to delete work', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const priorityBadge = (p) => {
    const map = {
      urgent: 'bg-rose-100 text-rose-800 border-rose-200',
      high: 'bg-amber-100 text-amber-800 border-amber-200',
      medium: 'bg-blue-100 text-blue-800 border-blue-200',
      low: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return (
      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${map[p] || map.medium}`}>
        {p}
      </span>
    );
  };

  const statusBadge = (s) => {
    const map = {
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      in_progress: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
    };
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${map[s] || map.pending}`}>
        {s.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pending Work & Tasks</h1>
          <p className="text-sm text-slate-500 mt-1">
            Assign room maintenance, grocery shopping, cleaning, and bill duties to specific members.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-100 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Pending Work</span>
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { key: 'all', label: 'All Tasks', count: counts.all },
          { key: 'pending', label: 'Pending', count: counts.pending },
          { key: 'in_progress', label: 'In Progress', count: counts.in_progress },
          { key: 'completed', label: 'Completed', count: counts.completed },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              statusFilter === tab.key
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                statusFilter === tab.key ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Priority</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Assigned Member</label>
          <select
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
          >
            <option value="all">All Members</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Search Work</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by work title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            />
          </div>
        </div>
      </div>

      {/* Task Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <CheckSquare className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No tasks found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'No tasks match your selected criteria.'
              : 'Create a pending task to delegate room work to members.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {priorityBadge(task.priority)}
                    {statusBadge(task.status)}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedTask(task);
                        setIsHistoryModalOpen(true);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                      title="View Task History"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(task)}
                      className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTask(task);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="font-extrabold text-slate-900 text-base mt-3 leading-snug">
                  {task.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 whitespace-pre-line line-clamp-3">
                  {task.description}
                </p>

                {/* Photo Thumbnail if any */}
                {task.photo && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoViewer({
                          isOpen: true,
                          url: task.photo,
                          title: `Attachment for: ${task.title}`,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-[11px] font-bold text-slate-700 transition"
                    >
                      <Image className="w-3.5 h-3.5 text-indigo-500" />
                      <span>View Task Photo</span>
                    </button>
                  </div>
                )}

                {/* Assigned members avatars */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Assigned Room Members
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {task.assignedTo && task.assignedTo.length > 0 ? (
                      task.assignedTo.map((m) => (
                        <div
                          key={m._id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700"
                        >
                          <div className="w-4 h-4 rounded-full bg-slate-300 text-[9px] font-bold flex items-center justify-center overflow-hidden">
                            {m.avatar ? (
                              <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                            ) : (
                              m.name?.charAt(0)
                            )}
                          </div>
                          <span className="text-[11px]">{m.name}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No members assigned</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Update Dropdown in footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {task.dueDate
                     ? `Due ${new Date(task.dueDate).toLocaleDateString()}`
                     : `Created ${new Date(task.createdAt || task.assignedDate).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                     minute: '2-digit',
                     hour12: true,
                    })}`}
                  </span>
                </div>

                <select
                  value={task.status}
                  onChange={(e) => handleStatusChangeQuick(task._id, e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Pending Work Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Create Pending Work</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Work Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Deep Clean Kitchen, Buy monthly rice bag, Call AC repair"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Description *</label>
                <textarea
                  rows="3"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Explain what exactly needs to be done, specific instructions, brand, budget, etc."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Assign to members */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Assign to Room Member(s) * (Select one or more)
                </label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-36 overflow-y-auto space-y-1.5">
                  {members.map((m) => {
                    const checked = formData.assignedTo.includes(m._id);
                    return (
                      <label
                        key={m._id}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer transition text-xs font-semibold text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleAssignee(m._id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{m.name}</span>
                        {m.roomNo && <span className="text-[10px] text-slate-400">(Room {m.roomNo})</span>}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Due Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Optional Photo Attachment</label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFileToUpload(e.target.files[0])}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <input
                    type="text"
                    value={formData.photo}
                    onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                    placeholder="Or paste photo link (e.g. broken faucet photo)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-100 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Assigning...' : 'Assign Work'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Pending Work Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit Task Details</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Work Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="3"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assignees</label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-36 overflow-y-auto space-y-1.5">
                  {members.map((m) => {
                    const checked = formData.assignedTo.includes(m._id);
                    return (
                      <label
                        key={m._id}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer transition text-xs font-semibold text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleAssignee(m._id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{m.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
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

      {/* Task History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Work Timeline History</h3>
                <p className="text-xs text-slate-500 truncate max-w-[260px]">{selectedTask?.title}</p>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 max-h-72 overflow-y-auto space-y-3">
              {selectedTask?.history && selectedTask.history.length > 0 ? (
                selectedTask.history.map((h, i) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <div className="w-2 rounded bg-indigo-500 flex-shrink-0"></div>
                    <div className="flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 capitalize">
                          {h.status.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(h.updatedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1">{h.note || 'Status updated'}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">By: {h.updatedByName || h.updatedBy?.name || 'User'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No history recorded yet.</p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Pending Task?"
        message={`Are you sure you want to permanently remove "${selectedTask?.title}"?`}
        confirmText="Yes, Delete Work"
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
