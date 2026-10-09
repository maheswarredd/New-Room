import User from '../models/User.js';
import Expense from '../models/Expense.js';
import Payment from '../models/Payment.js';
import BalanceAdjustment from '../models/BalanceAdjustment.js';
import RoomSettings from '../models/RoomSettings.js';
import { sendDueEmail } from './email.js';

export const calculateMemberDue = async (
  memberId,
  monthKey
) => {
  const members = await User.find({
    role: 'member',
  }).sort({ name: 1 });

  const member = members.find(
    (m) => m._id.toString() === memberId.toString()
  );

  if (!member) return null;

  const settings =
    (await RoomSettings.findOne()) || {
      defaultRentPerMember: 0,
    };

  const expenses = await Expense.find({
  monthKey,
  $or: [
    { approvalStatus: 'approved' },
    { approvalStatus: { $exists: false } },
  ],
});

const payments = await Payment.find({
  monthKey,
  isApproved: true,
  $or: [
    { approvalStatus: 'approved' },
    { approvalStatus: { $exists: false } },
  ],
});

  const adjustments = await BalanceAdjustment.find({
    monthKey,
  });

  let expenseShare = 0;

  expenses.forEach((expense) => {
    const split = expense.splitAmong?.find(
      (item) =>
        item.user &&
        item.user.toString() === memberId.toString()
    );

    if (split) {
      expenseShare += Number(split.amount || 0);
    } else if (
      expense.splitType === 'equal' &&
      members.length > 0
    ) {
      expenseShare +=
        Math.round(
          (Number(expense.amount) / members.length) * 100
        ) / 100;
    }
  });

  const hasRentExpense = expenses.some(
    (expense) => expense.category === 'rent'
  );

  const fixedRentDue = hasRentExpense
    ? 0
    : Number(
        member.monthlyRentShare ||
        settings.defaultRentPerMember ||
        0
      );

  const expensesPaid = expenses
    .filter(
      (expense) =>
        expense.paidBy?.toString() ===
        memberId.toString()
    )
    .reduce(
      (sum, expense) =>
        sum + Number(expense.amount || 0),
      0
    );

  const directPayments = payments
    .filter(
      (payment) =>
        payment.fromUser?.toString() ===
        memberId.toString()
    )
    .reduce(
      (sum, payment) =>
        sum + Number(payment.amount || 0),
      0
    );

  const adjustment = adjustments
    .filter(
      (item) =>
        item.user?.toString() ===
        memberId.toString()
    )
    .reduce(
      (sum, item) =>
        sum + Number(item.adjustmentAmount || 0),
      0
    );

  const previousExpenses = await Expense.find({
  monthKey: { $lt: monthKey },
  $or: [
    { approvalStatus: 'approved' },
    { approvalStatus: { $exists: false } },
  ],
});

const previousPayments = await Payment.find({
  monthKey: { $lt: monthKey },
  isApproved: true,
  $or: [
    { approvalStatus: 'approved' },
    { approvalStatus: { $exists: false } },
  ],
});

  const previousAdjustments =
    await BalanceAdjustment.find({
      monthKey: { $lt: monthKey },
    });

  let carryForward =
    Number(member.initialBalance || 0);

  const previousPaidExpenses =
    previousExpenses
      .filter(
        (expense) =>
          expense.paidBy?.toString() ===
          memberId.toString()
      )
      .reduce(
        (sum, expense) =>
          sum + Number(expense.amount || 0),
        0
      );

  const previousPaymentsTotal =
  previousPayments
    .filter(
      (payment) =>
        payment.fromUser?.toString() ===
        memberId.toString()
    )
    .reduce(
      (sum, payment) =>
        sum + Number(payment.amount || 0),
      0
    );

  let previousShare = 0;

  previousExpenses.forEach((expense) => {
    const split = expense.splitAmong?.find(
      (item) =>
        item.user?.toString() ===
        memberId.toString()
    );

    if (split) {
      previousShare += Number(split.amount || 0);
    } else if (members.length > 0) {
      previousShare +=
        Math.round(
          (Number(expense.amount) / members.length) * 100
        ) / 100;
    }
  });

  const previousAdjustment =
    previousAdjustments
      .filter(
        (item) =>
          item.user?.toString() ===
          memberId.toString()
      )
      .reduce(
        (sum, item) =>
          sum + Number(item.adjustmentAmount || 0),
        0
      );

  carryForward +=
  previousPaidExpenses +
  previousPaymentsTotal -
  previousShare +
  previousAdjustment;

  const totalPaid =
    expensesPaid + directPayments;

  const totalDue =
    expenseShare + fixedRentDue;

  const netBalance =
    carryForward +
    totalPaid -
    totalDue +
    adjustment;

  return {
    netBalance,
    pendingDue:
      netBalance < 0
        ? Math.abs(netBalance)
        : 0,
    advanceBalance:
      netBalance > 0
        ? netBalance
        : 0,
  };
};

export const notifyMemberDue = async ({
  memberId,
  monthKey,
}) => {
  try {
    const member = await User.findById(
      memberId
    ).select('name email');

    if (!member?.email) return;

    const result =
      await calculateMemberDue(
        memberId,
        monthKey
      );

    if (!result) return;

    if (result.pendingDue > 0) {
      await sendDueEmail({
        member,
        monthKey,
        pendingDue: result.pendingDue,
      });
    }
  } catch (error) {
    console.error(
      '[Brevo] Due notification failed:',
      error.message
    );
  }
};
