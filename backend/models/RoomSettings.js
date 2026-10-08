import mongoose from 'mongoose';

const roomSettingsSchema = new mongoose.Schema(
  {
    roomName: {
      type: String,
      default: 'Happy Roomies Residence',
      trim: true,
    },
    currency: {
      type: String,
      default: '₹',
    },
    totalMonthlyRent: {
      type: Number,
      default: 0,
    },
    defaultRentPerMember: {
      type: Number,
      default: 0,
    },
    allowMemberAddExpense: {
      type: Boolean,
      default: true,
    },
    allowMemberTaskUpdate: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const RoomSettings = mongoose.model('RoomSettings', roomSettingsSchema);
export default RoomSettings;
