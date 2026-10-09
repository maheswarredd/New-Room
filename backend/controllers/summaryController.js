import User from '../models/User.js';
import Expense from '../models/Expense.js';
import Payment from '../models/Payment.js';
import BalanceAdjustment from '../models/BalanceAdjustment.js';
import RoomSettings from '../models/RoomSettings.js';
import Task from '../models/Task.js';
import { sendDueEmail } from '../utils/email.js';

// Helper to get all months from expenses/payments or defaults
export const getAvailableMonths = async (req, res) => {
  try {
    const expenseMonths = await Expense.distinct('monthKey');
    const paymentMonths = await Payment.distinct('monthKey');
    const adjustmentMonths = await BalanceAdjustment.distinct('monthKey');

    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const currentKey = `${currentYear}-${currentMonth}`;

    const set = new Set([currentKey, ...expenseMonths, ...paymentMonths, ...adjustmentMonths]);
    const sorted = Array.from(set).sort().reverse();

    return res.status(200).json({ success: true, months: sorted, currentMonth: currentKey });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Calculate complete financial statement for a specific month
// @route   GET /api/summary/monthly
// @access  Private
export const getMonthlySummary = async (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    // Load active members and settings
    const members = await User.find({ role: 'member' }).sort({ name: 1 });
    const settings = (await RoomSettings.findOne()) || {
      roomName: 'Room Manager',
      currency: '₹',
      totalMonthlyRent: 0,
      defaultRentPerMember: 0,
    };

    // Load expenses for target month
    const expenses = await Expense.find({
  monthKey: targetMonth,
  $or: [
    { approvalStatus: 'approved' },
    { approvalStatus: { $exists: false } },
  ],
})
  .populate('paidBy', 'name avatar roomNo')
  .populate('splitAmong.user', 'name avatar roomNo');

const payments = await Payment.find({
  monthKey: targetMonth,
  isApproved: true,
  $or: [
    { approvalStatus: 'approved' },
    { approvalStatus: { $exists: false } },
  ],
})
  .populate('fromUser', 'name avatar roomNo');

    // Load adjustments for target month
    const adjustments = await BalanceAdjustment.find({ monthKey: targetMonth });

    // Category breakdown
    const categoryTotals = {
      rent: 0,
      grocery: 0,
      electricity: 0,
      restaurant: 0,
      daily: 0,
      maintenance: 0,
      other: 0,
    };

    let totalRoomExpenses = 0;
    expenses.forEach((exp) => {
      totalRoomExpenses += exp.amount;
      if (categoryTotals[exp.category] !== undefined) {
        categoryTotals[exp.category] += exp.amount;
      } else {
        categoryTotals.other += exp.amount;
      }
    });

    const totalPaymentsReceived = payments.reduce((sum, p) => sum + p.amount, 0);
    const roomFundExpenses = expenses
     .filter((e) => e.paymentSource === 'room_fund')
     .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const remainingRoomFund =
     totalPaymentsReceived - roomFundExpenses;
    const adminUser = await User.findOne({ role: 'admin' }).select('_id');
    const adminPaidExpenses = expenses
      .filter((e) => adminUser && e.paidBy && e.paidBy.toString() === adminUser._id.toString())
      .reduce((sum, e) => sum + e.amount, 0);
     const memberPaidExpenses = totalRoomExpenses - adminPaidExpenses;

    // Calculate carry forward from all previous months up to targetMonth
    // (A month key like '2026-09' is lexicographically less than '2026-10')
    const prevExpenses = await Expense.find({
    monthKey: { $lt: targetMonth },
     $or: [
     { approvalStatus: 'approved' },
     { approvalStatus: { $exists: false } },
      ],
      });

const prevPayments = await Payment.find({
  monthKey: { $lt: targetMonth },
  isApproved: true,
  $or: [
    { approvalStatus: 'approved' },
    { approvalStatus: { $exists: false } },
    ],
    });
    const prevAdjustments = await BalanceAdjustment.find({ monthKey: { $lt: targetMonth } });

    // Build per-member financial ledger
    const memberLedgers = members.map((member) => {
      const memberIdStr = member._id.toString();

      // 1. Target month expenses paid by this member
      const expensesPaidThisMonth = expenses
        .filter((e) => e.paidBy && e.paidBy._id.toString() === memberIdStr)
        .reduce((sum, e) => sum + e.amount, 0);

      // 2. Target month expenses share owed by this member
      let expenseShareThisMonth = 0;
      expenses.forEach((e) => {
        // If rent is already categorized as an expense and member has fixed rent, avoid double count if custom
        const userSplit = e.splitAmong.find(
          (s) => s.user && s.user._id.toString() === memberIdStr
        );
        if (userSplit) {
          expenseShareThisMonth += userSplit.amount;
        } else if (e.splitType === 'equal' && members.length > 0) {
          // If splitAmong wasn't populated or was equal
          const share = Math.round((e.amount / members.length) * 100) / 100;
          expenseShareThisMonth += share;
        }
      });

      // 3. Fixed monthly rent share (if member has specific share or default setting, and rent is not logged as an expense)
      const hasRentExpense = categoryTotals.rent > 0;
      const fixedRentDue = hasRentExpense ? 0 : (member.monthlyRentShare || settings.defaultRentPerMember || 0);

      // 4. Direct payments / rent paid to Admin
      const directPaymentsThisMonth = payments
        .filter((p) => p.fromUser && p.fromUser._id.toString() === memberIdStr)
        .reduce((sum, p) => sum + p.amount, 0);

      // 5. Total Paid & Total Share for this month
      const totalPaidThisMonth = expensesPaidThisMonth + directPaymentsThisMonth;
      const totalShareThisMonth = expenseShareThisMonth + fixedRentDue;

      // 6. Manual Adjustments for this month
      const adjustmentAmountThisMonth = adjustments
        .filter((a) => a.user.toString() === memberIdStr)
        .reduce((sum, a) => sum + a.adjustmentAmount, 0);

      // 7. Calculate previous carryover
      let carryForward = member.initialBalance || 0;

      // Add previous months' paid
      const prevExpensesPaid = prevExpenses
        .filter((e) => e.paidBy && e.paidBy.toString() === memberIdStr)
        .reduce((sum, e) => sum + e.amount, 0);
      const prevDirectPaid = prevPayments
        .filter((p) => p.fromUser && p.fromUser.toString() === memberIdStr)
        .reduce((sum, p) => sum + p.amount, 0);

      // Deduct previous months' shares
      let prevShare = 0;
      prevExpenses.forEach((e) => {
        const s = e.splitAmong.find((item) => item.user && item.user.toString() === memberIdStr);
        if (s) {
          prevShare += s.amount;
        } else if (members.length > 0) {
          prevShare += Math.round((e.amount / members.length) * 100) / 100;
        }
      });

      const prevAdj = prevAdjustments
        .filter((a) => a.user.toString() === memberIdStr)
        .reduce((sum, a) => sum + a.adjustmentAmount, 0);

      carryForward += (prevExpensesPaid + prevDirectPaid) - prevShare + prevAdj;

      // Net Balance for current month:
      // balance = carryForward + totalPaidThisMonth - totalShareThisMonth + adjustmentAmountThisMonth
      // Positive: member has advance / is owed money
      // Negative: member has pending due / needs to pay
      const netBalance = Math.round((carryForward + totalPaidThisMonth - totalShareThisMonth + adjustmentAmountThisMonth) * 100) / 100;
      const pendingDue = netBalance < 0 ? Math.abs(netBalance) : 0;
      const advanceBalance = netBalance > 0 ? netBalance : 0;

      return {
        member: {
          id: member._id,
          name: member.name,
          email: member.email,
          roomNo: member.roomNo,
          phone: member.phone,
          avatar: member.avatar,
          isActive: member.isActive,
          monthlyRentShare: member.monthlyRentShare,
        },
        carryForward: Math.round(carryForward * 100) / 100,
        fixedRentDue,
        expenseShare: Math.round(expenseShareThisMonth * 100) / 100,
        totalShareDue: Math.round(totalShareThisMonth * 100) / 100,
        expensesPaid: Math.round(expensesPaidThisMonth * 100) / 100,
        directPayments: Math.round(directPaymentsThisMonth * 100) / 100,
        totalPaid: Math.round(totalPaidThisMonth * 100) / 100,
        adjustments: Math.round(adjustmentAmountThisMonth * 100) / 100,
        netBalance,
        pendingDue,
        advanceBalance,
      };
    });

    // If logged-in user is a normal member, filter out other members' private financial statements
    let finalLedgers = memberLedgers;
    let myLedger = null;

    if (req.user.role !== 'admin') {
      myLedger = memberLedgers.find((l) => l.member.id.toString() === req.user._id.toString());
      // Normal members should only see their own private ledger
      finalLedgers = myLedger ? [myLedger] : [];
    }

    const totalPendingMemberDue = Math.round(memberLedgers.reduce((sum, item) => sum + item.pendingDue, 0) * 100) / 100;
    const totalAdvanceBalance = Math.round(memberLedgers.reduce((sum, item) => sum + item.advanceBalance, 0) * 100) / 100;

    return res.status(200).json({
      success: true,
      month: targetMonth,
      settings,
      roomSummary: {
        totalRoomExpenses,
        totalPaymentsReceived,
        totalRoomFund: Math.round(totalPaymentsReceived * 100) / 100,
        usedRoomFund: Math.round(roomFundExpenses * 100) / 100,
        remainingRoomFund: Math.round(remainingRoomFund * 100) / 100,
        adminPaidExpenses: Math.round(adminPaidExpenses * 100) / 100,
        memberPaidExpenses: Math.round(memberPaidExpenses * 100) / 100,
        totalPendingMemberDue,
        totalAdvanceBalance,
        remainingBalance: totalPendingMemberDue,
        categoryTotals,
        totalMembers: members.length,
        activeMembers: members.filter((m) => m.isActive).length,
      },
      memberLedgers: finalLedgers,
      myLedger,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Dashboard overview metrics
// @route   GET /api/summary/dashboard
// @access  Private
export const getDashboardMetrics = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const monthKey = `${currentYear}-${currentMonth}`;

    const isAdmin = req.user.role === 'admin';

    // Pending tasks count
    let pendingTasksQuery = { status: { $in: ['pending', 'in_progress'] } };
    if (!isAdmin) {
      pendingTasksQuery.assignedTo = req.user._id;
    }
    const pendingTasksCount = await Task.countDocuments(pendingTasksQuery);
    const recentTasks = await Task.find(pendingTasksQuery)
      .populate('assignedTo', 'name avatar')
      .sort({ priority: -1, createdAt: -1 })
      .limit(5);

    // Expenses this month
    const expensesThisMonth = await Expense.find({ monthKey })
      .populate('paidBy', 'name avatar roomNo')
      .sort({ date: -1 })
      .limit(6);

    const totalExpenses = (await Expense.find({ monthKey })).reduce((sum, e) => sum + e.amount, 0);

    // If Admin, get total active members & total dues
    let membersCount = 0;
    if (isAdmin) {
      membersCount = await User.countDocuments({ role: 'member', isActive: true });
    }

    // Get personal stats if member
    let memberStats = null;
    if (!isAdmin) {
      const myExpensesPaid = (
        await Expense.find({ monthKey, paidBy: req.user._id })
      ).reduce((sum, e) => sum + e.amount, 0);

      const myDirectPayments = (
        await Payment.find({ monthKey, fromUser: req.user._id })
      ).reduce((sum, p) => sum + p.amount, 0);

      memberStats = {
        totalPaidThisMonth: myExpensesPaid + myDirectPayments,
      };
    }

    return res.status(200).json({
      success: true,
      monthKey,
      metrics: {
        totalExpensesThisMonth: totalExpenses,
        pendingTasksCount,
        membersCount,
        recentTasks,
        recentExpenses: expensesThisMonth,
        memberStats,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
