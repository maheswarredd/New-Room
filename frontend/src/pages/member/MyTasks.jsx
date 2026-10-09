import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PhotoModal from '../../components/PhotoModal';
import {
  CheckSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Image,
  History,
  X,
  Upload,
} from 'lucide-react';

export default function MyTasks() {
  const { user, showToast } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Status update modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [photoViewer, setPhotoViewer] = useState({ isOpen: false, url: '', title: '' });

  const [updateStatus, setUpdateStatus] = useState('in_progress');
  const [updateNote, setUpdateNote] = useState('');
  const [completionFile, setCompletionFile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchMyTasks();
  }, [statusFilter]);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      let query = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await api.get(`/tasks${query}`);
      if (res.data.success) {
        setTasks(res.data.tasks || []);
      }
    } catch (err) {
      showToast('Error loading assigned tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUpdateModal = (task, newStatus) => {
    setSelectedTask(task);
    setUpdateStatus(newStatus);
    setUpdateNote('');
    setCompletionFile(null);
    setIsUpdateModalOpen(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const data = new FormData();
      data.append('status', updateStatus);
      data.append('note', updateNote || `Status updated to ${updateStatus} by ${user.name}`);

      if (completionFile) {
        data.append('completionPhoto', completionFile);
      }

      const res = await api.patch(`/tasks/${selectedTask._id}/status`, data);
      if (res.data.success) {
        showToast(`Task marked as ${updateStatus.replace('_', ' ')}!`, 'success');
        setIsUpdateModalOpen(false);
        fetchMyTasks();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update task status', 'error');
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            My Assigned Tasks & Pending Work
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Duties assigned to you by the Room Admin. Update work status when in progress or done.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {['all', 'pending', 'in_progress', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
              statusFilter === status
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Task Cards */}
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
            You do not have any {statusFilter !== 'all' ? statusFilter.replace('_', ' ') : ''} tasks assigned to you.
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
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {priorityBadge(task.priority)}
                    {statusBadge(task.status)}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTask(task);
                      setIsHistoryModalOpen(true);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                    title="View Timeline"
                  >
                    <History className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base mt-3 leading-snug">
                  {task.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 whitespace-pre-line">
                  {task.description}
                </p>

                {/* Photo if provided by Admin */}
                {task.photo && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoViewer({
                          isOpen: true,
                          url: task.photo,
                          title: `Task Photo - ${task.title}`,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-[11px] font-bold text-slate-700 transition"
                    >
                      <Image className="w-3.5 h-3.5 text-indigo-500" />
                      <span>View Reference Photo</span>
                    </button>
                  </div>
                )}

                {/* Completion proof if uploaded */}
                {task.completionPhoto && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoViewer({
                          isOpen: true,
                          url: task.completionPhoto,
                          title: `Completion Proof - ${task.title}`,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-[11px] font-bold text-emerald-700 transition"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span>View Completion Proof</span>
                    </button>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>
                    Assigned: {new Date(task.createdAt || task.assignedDate).toLocaleString('en-IN', {
                     day: '2-digit',
                     month: 'short',
                     year: 'numeric',
                     hour: '2-digit',
                     minute: '2-digit',
                     hour12: true,
                     })}
                  </span>
                  {task.dueDate && (
                    <span className="font-semibold text-amber-600">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                {task.status === 'pending' && (
                  <button
                    onClick={() => handleOpenUpdateModal(task, 'in_progress')}
                    className="flex-1 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition"
                  >
                    Start Work (In Progress)
                  </button>
                )}

                {task.status === 'in_progress' && (
                  <button
                    onClick={() => handleOpenUpdateModal(task, 'completed')}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-100 transition"
                  >
                    Mark as Completed
                  </button>
                )}

                {task.status === 'completed' && (
                  <span className="w-full py-2 text-center text-emerald-700 text-xs font-bold bg-emerald-50 rounded-xl border border-emerald-100">
                    ✓ Completed on {task.completedAt
                     ? new Date(task.completedAt).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                      })
                      : 'Record'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Update Status Modal */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Update Status to <span className="capitalize text-indigo-600">{updateStatus.replace('_', ' ')}</span>
              </h3>
              <button onClick={() => setIsUpdateModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="mt-4 space-y-4 text-xs">
              <p className="font-semibold text-slate-700">{selectedTask?.title}</p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Note / Comments</label>
                <textarea
                  rows="2"
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  placeholder="e.g. Bought groceries from supermarket, receipt attached or kitchen cleaned"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {updateStatus === 'completed' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Completion Proof Photo (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCompletionFile(e.target.files[0])}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-100 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Confirm Update'}
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
              <h3 className="text-base font-bold text-slate-900">Task Timeline</h3>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 max-h-72 overflow-y-auto space-y-3">
              {selectedTask?.history?.map((h, i) => (
                <div key={i} className="flex gap-3 text-xs">
                  <div className="w-2 rounded bg-indigo-500 flex-shrink-0"></div>
                  <div className="flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 capitalize">{h.status.replace('_', ' ')}</span>
                      <span className="text-[10px] text-slate-400">{new Date(h.updatedAt).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-600 mt-1">{h.note || 'Status updated'}</p>
                  </div>
                </div>
              ))}
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
