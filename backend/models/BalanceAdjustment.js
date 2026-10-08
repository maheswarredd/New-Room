import mongoose from 'mongoose';

const balanceAdjustmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    monthKey: {
      type: String,
      required: true, // "YYYY-MM"
    },
    adjustmentAmount: {
      type: Number,
      required: true, // positive adds credit, negative adds debit/penalty
    },
    reason: {
      type: String,
      required: [true, 'Reason for balance adjustment is required'],
      trim: true,
    },
    adjustedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const BalanceAdjustment = mongoose.model('BalanceAdjustment', balanceAdjustmentSchema);
export default BalanceAdjustment;
