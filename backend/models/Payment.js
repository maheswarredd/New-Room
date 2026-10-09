import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Member is required'],
    },
    toAdmin: {
      type: Boolean,
      default: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    paymentType: {
      type: String,
      enum: ['rent', 'expense_settlement', 'fund_advance', 'other'],
      default: 'rent',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'bank_transfer', 'other'],
      default: 'upi',
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    monthKey: {
      type: String,
      required: true,
      index: true,
    },
    proofPhoto: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isApproved: {
  type: Boolean,
  default: true,
  index: true,
  },
  approvalStatus: {
   type: String,
   enum: ['pending', 'approved', 'rejected'],
   default: 'approved',
   index: true,
   },
  rejectionReason: {
   type: String,
   default: '',
   trim: true,
 },
  reviewedBy: {
   type: mongoose.Schema.Types.ObjectId,
   ref: 'User',
  },
 reviewedAt: {
  type: Date,
 },
  },
  {
    timestamps: true,
  }
);

paymentSchema.pre('validate', function (next) {
  if (this.date && !this.monthKey) {
    const d = new Date(this.date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    this.monthKey = `${year}-${month}`;
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
