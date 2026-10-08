import User from '../models/User.js';
import BalanceAdjustment from '../models/BalanceAdjustment.js';
import Expense from '../models/Expense.js';
import Payment from '../models/Payment.js';
import Task from '../models/Task.js';

// @desc    Get all members (Admin gets full detail; Members get basic list for selection/tasks)
// @route   GET /api/members
// @access  Private
export const getMembers = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';

    let query = { role: 'member' };
    if (!isAdmin) {
      // Non-admin members only get active members' public display info
      query.isActive = true;
      const members = await User.find(query).select('name avatar roomNo');
      return res.status(200).json({ success: true, members });
    }

    // Admin gets all details
    const members = await User.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, members });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single member details (Admin only, or member viewing self)
// @route   GET /api/members/:id
// @access  Private
export const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view other member details' });
    }

    const member = await User.findById(id).select('-password');
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    return res.status(200).json({ success: true, member });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new member (Admin only)
// @route   POST /api/members
// @access  Private (Admin)
export const createMember = async (req, res) => {
  try {
    const { name, email, password, roomNo, phone, avatar, monthlyRentShare, initialBalance } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email/username, and password are required to create a member account.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A member or user with this email/username already exists.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const newMember = new User({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: 'member',
      roomNo: roomNo ? roomNo.trim() : '',
      phone: phone ? phone.trim() : '',
      avatar: avatar || '',
      monthlyRentShare: Number(monthlyRentShare) || 0,
      initialBalance: Number(initialBalance) || 0,
      isActive: true,
    });

    await newMember.save();

    return res.status(201).json({
      success: true,
      message: `Member ${newMember.name} created successfully!`,
      member: newMember,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update member details (Admin only)
// @route   PUT /api/members/:id
// @access  Private (Admin)
export const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, roomNo, phone, avatar, monthlyRentShare, initialBalance, isActive } = req.body;

    const member = await User.findById(id);
    if (!member || member.role !== 'member') {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    if (name) member.name = name.trim();
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail !== member.email) {
        const emailExists = await User.findOne({ email: cleanEmail });
        if (emailExists) {
          return res.status(400).json({ success: false, message: 'Email/username is already in use' });
        }
        member.email = cleanEmail;
      }
    }

    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }
      member.password = password;
    }

    if (roomNo !== undefined) member.roomNo = roomNo.trim();
    if (phone !== undefined) member.phone = phone.trim();
    if (avatar !== undefined) member.avatar = avatar;
    if (monthlyRentShare !== undefined) member.monthlyRentShare = Number(monthlyRentShare) || 0;
    if (initialBalance !== undefined) member.initialBalance = Number(initialBalance) || 0;
    if (isActive !== undefined) member.isActive = Boolean(isActive);

    await member.save();

    return res.status(200).json({
      success: true,
      message: 'Member updated successfully',
      member,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete member (Admin only)
// @route   DELETE /api/members/:id
// @access  Private (Admin)
export const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await User.findById(id);

    if (!member || member.role !== 'member') {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // Clean up or dissociate
    await Task.updateMany({ assignedTo: id }, { $pull: { assignedTo: id } });
    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Member ${member.name} removed successfully`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Adjust balance / carry-forward for member (Admin only)
// @route   POST /api/members/:id/adjust-balance
// @access  Private (Admin)
export const adjustBalance = async (req, res) => {
  try {
    const { id } = req.params;
    const { monthKey, adjustmentAmount, reason } = req.body;

    if (!monthKey || adjustmentAmount === undefined || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Month (YYYY-MM), adjustment amount, and reason are required.',
      });
    }

    const member = await User.findById(id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const adjustment = new BalanceAdjustment({
      user: id,
      monthKey,
      adjustmentAmount: Number(adjustmentAmount),
      reason: reason.trim(),
      adjustedBy: req.user._id,
    });

    await adjustment.save();

    return res.status(201).json({
      success: true,
      message: `Balance adjusted for ${member.name} by ${adjustmentAmount}`,
      adjustment,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
