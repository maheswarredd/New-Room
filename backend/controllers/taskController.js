import Task from '../models/Task.js';
import RoomSettings from '../models/RoomSettings.js';
import { sendPushToUsers } from '../utils/fcm.js';
import { sendTaskAssignedEmail } from '../utils/email.js';

// @desc    Get tasks (Admin gets all with filters; Member gets ONLY tasks assigned to them)
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res) => {
  try {
    const { status, priority, memberId, search } = req.query;
    let filter = {};

    if (req.user.role !== 'admin') {
      // Member can strictly only see tasks assigned to them
      filter.assignedTo = req.user._id;
    } else if (memberId && memberId !== 'all') {
      filter.assignedTo = memberId;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (priority && priority !== 'all') {
      filter.priority = priority;
    }

    if (search && search.trim() !== '') {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name avatar roomNo')
      .populate('createdBy', 'name')
      .populate('history.updatedBy', 'name role')
      .sort({ createdAt: -1 });

    const counts = {
      all: tasks.length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
    };

    return res.status(200).json({
      success: true,
      counts,
      tasks,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id)
      .populate('assignedTo', 'name avatar roomNo')
      .populate('createdBy', 'name')
      .populate('history.updatedBy', 'name role');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // If member, ensure they are in assignedTo
    if (req.user.role !== 'admin') {
      const isAssigned = task.assignedTo.some(
        (m) => m._id.toString() === req.user._id.toString()
      );
      if (!isAssigned) {
        return res.status(403).json({ success: false, message: 'You are not assigned to this task' });
      }
    }

    return res.status(200).json({ success: true, task });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a pending task (Admin only)
// @route   POST /api/tasks
// @access  Private (Admin)
export const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate, assignedDate, photo } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Task title and detailed description are required.',
      });
    }

    // assignedTo can be a single ID or array of IDs
    let assignees = [];
    if (Array.isArray(assignedTo)) {
      assignees = assignedTo;
    } else if (assignedTo) {
      assignees = [assignedTo];
    }

    let photoUrl = photo || '';
    if (req.file) {
      photoUrl = `/uploads/${req.file.filename}`;
    }

    const task = new Task({
      title: title.trim(),
      description: description.trim(),
      photo: photoUrl,
      priority: priority || 'medium',
      status: 'pending',
      assignedTo: assignees,
      assignedDate: assignedDate ? new Date(assignedDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdBy: req.user._id,
      history: [
        {
          status: 'pending',
          updatedBy: req.user._id,
          updatedByName: req.user.name,
          note: 'Task created and assigned',
          updatedAt: new Date(),
        },
      ],
    });

    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name avatar roomNo')
      .populate('createdBy', 'name');
    // ---------------------------------------------
// BREVO EMAIL - NEW TASK ASSIGNED
// ---------------------------------------------
try {
  const taskWithEmails = await Task.findById(task._id)
    .populate('assignedTo', 'name email roomNo')
    .populate('createdBy', 'name email');

  await Promise.all(
    (taskWithEmails?.assignedTo || []).map((member) =>
      sendTaskAssignedEmail({
        member,
        task: taskWithEmails,
        admin: taskWithEmails.createdBy,
      })
    )
  );
} catch (emailError) {
  console.error(
    '[Brevo] Task assignment email failed:',
    emailError.message
  );
}

    await sendPushToUsers(assignees, {
      title: '📋 New Task Assigned',
      body: `${title.trim()} • Priority: ${priority || 'medium'}`,
    }, { type: 'task', taskId: task._id.toString(), url: '/member/tasks' });

    return res.status(201).json({
      success: true,
      message: 'Pending work created and assigned successfully',
      task: populated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update task details (Admin only)
// @route   PUT /api/tasks/:id
// @access  Private (Admin)
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const { title, description, assignedTo, priority, status, dueDate, assignedDate, photo } = req.body;

    if (title) task.title = title.trim();
    if (description) task.description = description.trim();
    if (priority) task.priority = priority;
    if (assignedDate) task.assignedDate = new Date(assignedDate);
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;

    if (assignedTo !== undefined) {
      task.assignedTo = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
    }

    if (req.file) {
      task.photo = `/uploads/${req.file.filename}`;
    } else if (photo !== undefined) {
      task.photo = photo;
    }

    if (status && status !== task.status) {
      const oldStatus = task.status;
      task.status = status;
      if (status === 'completed') {
        task.completedAt = new Date();
      } else {
        task.completedAt = null;
      }
      task.history.push({
        status,
        updatedBy: req.user._id,
        updatedByName: req.user.name,
        note: `Status changed from ${oldStatus} to ${status} by Admin`,
        updatedAt: new Date(),
      });
    }

    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name avatar roomNo')
      .populate('createdBy', 'name')
      .populate('history.updatedBy', 'name role');

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task: populated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update task status (Members can update their assigned tasks or Admin)
// @route   PATCH /api/tasks/:id/status
// @access  Private
export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, completionPhoto } = req.body;

    if (!status || !['pending', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status (pending, in_progress, completed) is required.',
      });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // If user is a member, verify they are assigned and settings allow member updates
    if (req.user.role !== 'admin') {
      const settings = await RoomSettings.findOne();
      if (settings && settings.allowMemberTaskUpdate === false) {
        return res.status(403).json({
          success: false,
          message: 'Member status updates are disabled by the Room Admin.',
        });
      }

      const isAssigned = task.assignedTo.some(
        (userId) => userId.toString() === req.user._id.toString()
      );
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'You can only update tasks assigned to you.',
        });
      }
    }

    const oldStatus = task.status;
    task.status = status;

    if (status === 'completed') {
      task.completedAt = new Date();
    } else {
      task.completedAt = null;
    }

    if (req.file) {
      task.completionPhoto = `/uploads/${req.file.filename}`;
    } else if (completionPhoto) {
      task.completionPhoto = completionPhoto;
    }

    task.history.push({
      status,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      note: note ? note.trim() : `Status updated to ${status}`,
      updatedAt: new Date(),
    });

    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name avatar roomNo')
      .populate('createdBy', 'name')
      .populate('history.updatedBy', 'name role');

    return res.status(200).json({
      success: true,
      message: `Task status updated from ${oldStatus} to ${status}`,
      task: populated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete task (Admin only)
// @route   DELETE /api/tasks/:id
// @access  Private (Admin)
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await Task.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
