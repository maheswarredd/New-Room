import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Expense title or item name is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['rent', 'grocery', 'electricity', 'restaurant', 'daily', 'maintenance', 'other'],
      default: 'daily',
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    monthKey: {
      type: String,
      required: true, // format: "YYYY-MM"
      index: true,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    paymentSource: {
     type: String,
     enum: ['member', 'room_fund'],
     default: 'member',
     index: true,
    },
    splitType: {
      type: String,
      enum: ['equal', 'custom', 'single'],
      default: 'equal',
    },
    // For custom or specific splits:
    splitAmong: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        amount: {
          type: Number,
          default: 0,
        },
      },
    ],
    description: {
      type: String,
      default: '',
      trim: true,
    },
    receiptPhoto: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Auto-derive monthKey before saving if not provided
expenseSchema.pre('validate', function (next) {
  if (this.date && !this.monthKey) {
    const d = new Date(this.date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    this.monthKey = `${year}-${month}`;
  }
  next();
});

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
