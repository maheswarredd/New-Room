import mongoose from 'mongoose';

const carryoverResetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    monthKey: {
      type: String,
      required: true,
    },
    resetBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resetAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

carryoverResetSchema.index(
  { user: 1, monthKey: 1 },
  { unique: true }
);

export default mongoose.model(
  'CarryoverReset',
  carryoverResetSchema
);
