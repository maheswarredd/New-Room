import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { sendPushToUsers } from '../utils/fcm.js';

// @desc    Get payments (Admin sees all; Member sees their own)
// @route   GET /api/payments
// @access  Private
export const getPayments = async (req, res) => {
  try {
    const { month, memberId, type } = req.query;
    let filter = {};

    if (req.user.role !== 'admin') {
      filter.fromUser = req.user._id;
    } else if (memberId && memberId !== 'all') {
      filter.fromUser = memberId;
    }

    if (month) {
      filter.monthKey = month;
    }

    if (type && type !== 'all') {
      filter.paymentType = type;
    }

    const payments = await Payment.find(filter)
      .populate('fromUser', 'name avatar roomNo phone')
      .populate('recordedBy', 'name role')
      .sort({ date: -1, createdAt: -1 });

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    return res.status(200).json({
      success: true,
      count: payments.length,
      totalPaid,
      payments,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record new payment (Admin can record for any member; Member can record own payment)
// @route   POST /api/payments
// @access  Private
export const createPayment = async (req, res) => {
  try {
    const { fromUser, amount, paymentType, paymentMethod, date, proofPhoto, notes } = req.body;

    const actualFromUser = req.user.role === 'admin' && fromUser ? fromUser : req.user._id;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid payment amount is required.',
      });
    }

    const paymentDate = date ? new Date(date) : new Date();
    const year = paymentDate.getFullYear();
    const month = String(paymentDate.getMonth() + 1).padStart(2, '0');
    const monthKey = `${year}-${month}`;

    let photoUrl = proofPhoto || '';
    if (req.file) {
      photoUrl = `/uploads/${req.file.filename}`;
    }

    const payment = new Payment({
      fromUser: actualFromUser,
      amount: parseFloat(amount),
      paymentType: paymentType || 'rent',
      paymentMethod: paymentMethod || 'upi',
      date: paymentDate,
      monthKey,
      proofPhoto: photoUrl,
      notes: notes ? notes.trim() : '',
      recordedBy: req.user._id,
      isApproved: true,
    });

    await payment.save();

    const populated = await Payment.findById(payment._id).populate('fromUser', 'name avatar roomNo');

    await sendPushToUsers([actualFromUser], {
      title: '💳 Payment Recorded',
      body: `₹${parseFloat(amount).toFixed(2)} payment recorded successfully`,
    }, { type: 'payment', paymentId: payment._id.toString(), url: '/member/payments' });

    return res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      payment: populated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete payment (Admin only)
// @route   DELETE /api/payments/:id
// @access  Private (Admin)
export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    await Payment.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Payment record deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
