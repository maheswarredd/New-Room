import Expense from '../models/Expense.js';
import User from '../models/User.js';
import RoomSettings from '../models/RoomSettings.js';
import { sendPushToUsers } from '../utils/fcm.js';

// @desc    Get expenses with filtering by month, category, paidBy, search
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res) => {
  try {
    const { month, category, paidBy, search, startDate, endDate } = req.query;
    let filter = {};

    if (month) {
      filter.monthKey = month;
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (paidBy && paidBy !== 'all') {
      filter.paidBy = paidBy;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    if (search && search.trim() !== '') {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const expenses = await Expense.find(filter)
      .populate('paidBy', 'name avatar roomNo role')
      .populate('splitAmong.user', 'name avatar roomNo')
      .populate('createdBy', 'name')
      .sort({ date: -1, createdAt: -1 });

    const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);

    // Grouping by category
    const categoryTotals = expenses.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      count: expenses.length,
      totalAmount,
      categoryTotals,
      expenses,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req, res) => {
  try {
    const {
      title,
      amount,
      category,
      date,
      paidBy,
      splitType,
      splitAmong,
      description,
      receiptPhoto,
    } = req.body;

    if (!title || !amount || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, amount, and category are required.',
      });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number.',
      });
    }

    // Check member permissions if not admin
    if (req.user.role !== 'admin') {
      const settings = await RoomSettings.findOne();
      if (settings && settings.allowMemberAddExpense === false) {
        return res.status(403).json({
          success: false,
          message: 'Members are not permitted to add expenses per room settings.',
        });
      }
    }

    // Determine who paid
    const actualPaidBy = req.user.role === 'admin' && paidBy ? paidBy : req.user._id;

    // Calculate split among active members if 'equal'
    let resolvedSplit = [];
    const members = await User.find({ role: 'member', isActive: true });

    if (splitType === 'custom' && Array.isArray(splitAmong) && splitAmong.length > 0) {
      resolvedSplit = splitAmong;
    } else {
      // Split equally among all active members
      if (members.length > 0) {
        const perMemberShare = Math.round((numAmount / members.length) * 100) / 100;
        resolvedSplit = members.map((m) => ({
          user: m._id,
          amount: perMemberShare,
        }));
      }
    }

    const expenseDate = date ? new Date(date) : new Date();
    const year = expenseDate.getFullYear();
    const month = String(expenseDate.getMonth() + 1).padStart(2, '0');
    const monthKey = `${year}-${month}`;

    let photoUrl = receiptPhoto || '';
    if (req.file) {
      photoUrl = `/uploads/${req.file.filename}`;
    }

    const expense = new Expense({
      title: title.trim(),
      amount: numAmount,
      category,
      date: expenseDate,
      monthKey,
      paidBy: actualPaidBy,
      splitType: splitType || 'equal',
      splitAmong: resolvedSplit,
      description: description ? description.trim() : '',
      receiptPhoto: photoUrl,
      createdBy: req.user._id,
    });

    await expense.save();

    const populated = await Expense.findById(expense._id)
      .populate('paidBy', 'name avatar roomNo')
      .populate('splitAmong.user', 'name avatar roomNo');

    const affectedUsers = resolvedSplit.map((item) => item.user).filter(Boolean);
    await sendPushToUsers(affectedUsers, {
      title: '🧾 New Expense Added',
      body: `${title.trim()} • ₹${numAmount.toFixed(2)} • Your split is included`,
    }, { type: 'expense', expenseId: expense._id.toString(), url: '/member/expenses' });

    return res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      expense: populated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && expense.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this expense' });
    }

    const {
      title,
      amount,
      category,
      date,
      paidBy,
      splitType,
      splitAmong,
      description,
      receiptPhoto,
    } = req.body;

    if (title) expense.title = title.trim();
    if (category) expense.category = category;
    if (description !== undefined) expense.description = description.trim();

    if (amount) {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
      }
      expense.amount = numAmount;
    }

    if (date) {
      expense.date = new Date(date);
      const year = expense.date.getFullYear();
      const month = String(expense.date.getMonth() + 1).padStart(2, '0');
      expense.monthKey = `${year}-${month}`;
    }

    if (req.user.role === 'admin' && paidBy) {
      expense.paidBy = paidBy;
    }

    if (splitType) expense.splitType = splitType;
    if (splitAmong && Array.isArray(splitAmong)) {
      expense.splitAmong = splitAmong;
    } else if (splitType === 'equal' && amount) {
      const members = await User.find({ role: 'member', isActive: true });
      if (members.length > 0) {
        const perMemberShare = Math.round((expense.amount / members.length) * 100) / 100;
        expense.splitAmong = members.map((m) => ({
          user: m._id,
          amount: perMemberShare,
        }));
      }
    }

    if (req.file) {
      expense.receiptPhoto = `/uploads/${req.file.filename}`;
    } else if (receiptPhoto !== undefined) {
      expense.receiptPhoto = receiptPhoto;
    }

    await expense.save();

    const populated = await Expense.findById(expense._id)
      .populate('paidBy', 'name avatar roomNo')
      .populate('splitAmong.user', 'name avatar roomNo');

    return res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      expense: populated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    if (req.user.role !== 'admin' && expense.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this expense' });
    }

    await Expense.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
