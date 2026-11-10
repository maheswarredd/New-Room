import User from '../models/User.js';
import BalanceAdjustment from '../models/BalanceAdjustment.js';
import Expense from '../models/Expense.js';
import Payment from '../models/Payment.js';
import Task from '../models/Task.js';
import CarryoverReset from '../models/CarryoverReset.js';
import { sendBrevoEmail } from '../utils/email.js';

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
    const {
  name,
  email,
  password,
  roomNo,
  phone,
  avatar,
  monthlyRentShare,
  initialBalance,
  accountBalance
} = req.body;

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
      accountBalance: Number(accountBalance) || 0,
      isActive: true,
    });

    await newMember.save();
    try {
  await sendBrevoEmail({
    to: newMember.email,
    subject: '👋 Welcome to RoomMate Pro',
    html: `
      <div style="font-family:Arial;padding:25px">
        <h2>Welcome ${newMember.name} 👋</h2>

        <p>
          Your RoomMate Pro account has been created successfully.
        </p>

        <p>
          You can now login and check:
        </p>

        <ul>
          <li>Room expenses</li>
          <li>Your payments</li>
          <li>Pending dues</li>
          <li>Assigned tasks</li>
        </ul>

        <p>
          Please use the login credentials provided by the Room Admin.
        </p>
      </div>
    `,
  });
} catch (emailError) {
  console.error(
    '[Brevo] Welcome email failed:',
    emailError.message
  );
}

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
    const {
  name,
  email,
  password,
  roomNo,
  phone,
  avatar,
  monthlyRentShare,
  initialBalance,
  accountBalance,
  isActive
} = req.body;

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
if (monthlyRentShare !== undefined) {
  member.monthlyRentShare = Number(monthlyRentShare) || 0;
}
if (initialBalance !== undefined) {
  member.initialBalance = Number(initialBalance) || 0;
}
    if (accountBalance !== undefined) {
  const parsedBalance = Number(accountBalance);

  if (!Number.isFinite(parsedBalance)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid account balance',
    });
  }

  member.accountBalance = parsedBalance;
}

// Correctly handle Boolean and string values
if (isActive !== undefined) {
  member.isActive = isActive === true || isActive === 'true';
}

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
// ==========================================
// ADMIN: GET ALL MEMBERS CARRYOVER DATA
// ==========================================

export const getCarryoverManagement = async (req, res) => {
  try {
    const { monthKey } = req.query;

    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
      return res.status(400).json({
        success: false,
        message: 'Valid month is required',
      });
    }

    const members = await User.find({
      role: 'member',
    })
      .select('name email roomNo avatar initialBalance accountBalance isActive')
      .sort({ name: 1 });

    const adjustments = await BalanceAdjustment.find({
      monthKey,
      adjustmentType: 'carryover',
    });

    const adjustmentMap = new Map(
      adjustments.map((item) => [
        item.user.toString(),
        item
      ])
    );

    const data = members.map((member) => {
      const adjustment = adjustmentMap.get(
        member._id.toString()
      );

      return {
        ...member.toObject(),
        carryoverAdjustment: adjustment
          ? adjustment.adjustmentAmount
          : 0,
        adjustmentId: adjustment?._id || null,
      };
    });

    return res.status(200).json({
      success: true,
      monthKey,
      members: data,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ==========================================
// ADMIN: ADD / EDIT MEMBER CARRYOVER
// ==========================================

export const saveMemberCarryover = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      monthKey,
      adjustmentAmount,
      reason,
    } = req.body;

    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
      return res.status(400).json({
        success: false,
        message: 'Valid month is required',
      });
    }

    const amount = Number(adjustmentAmount);

    if (
      adjustmentAmount === undefined ||
      adjustmentAmount === null ||
      adjustmentAmount === '' ||
      !Number.isFinite(amount)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid carryover amount',
      });
    }

    const member = await User.findOne({
      _id: id,
      role: 'member',
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    const adjustment = await BalanceAdjustment.findOneAndUpdate(
      {
        user: id,
        monthKey,
        adjustmentType: 'carryover',
      },
      {
        $set: {
          adjustmentAmount: amount,
          reason: reason || 'Admin managed carryover',
          adjustedBy: req.user._id,
        },
        $setOnInsert: {
          user: id,
          monthKey,
          adjustmentType: 'carryover',
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Member carryover saved successfully',
      adjustment,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ==========================================
// ADMIN: REMOVE MEMBER CARRYOVER
// ==========================================

export const removeMemberCarryover = async (req, res) => {
  try {
    const { id } = req.params;
    const { monthKey } = req.query;

    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
      return res.status(400).json({
        success: false,
        message: 'Valid month is required',
      });
    }

    const member = await User.findOne({
      _id: id,
      role: 'member',
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    await BalanceAdjustment.deleteOne({
      user: id,
      monthKey,
      adjustmentType: 'carryover',
    });

    return res.status(200).json({
      success: true,
      message: 'Carryover adjustment removed successfully',
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ==========================================
// ADMIN: RESET INDIVIDUAL MEMBER CARRYOVER
// ==========================================

export const resetManagedMemberCarryover = async (req, res) => {
  try {
    const { id } = req.params;
    const { monthKey } = req.body;

    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
      return res.status(400).json({
        success: false,
        message: 'Valid month is required',
      });
    }

    const member = await User.findOne({
      _id: id,
      role: 'member',
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    await CarryoverReset.findOneAndUpdate(
      {
        user: id,
        monthKey,
      },
      {
        $set: {
          resetBy: req.user._id,
          resetAt: new Date(),
        },
        $setOnInsert: {
          user: id,
          monthKey,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    await BalanceAdjustment.deleteOne({
      user: id,
      monthKey,
      adjustmentType: 'carryover',
    });

    return res.status(200).json({
      success: true,
      message: `${member.name} carryover reset successfully`,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

