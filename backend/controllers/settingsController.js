import RoomSettings from '../models/RoomSettings.js';

// @desc    Get room settings
// @route   GET /api/settings
// @access  Private
export const getSettings = async (req, res) => {
  try {
    let settings = await RoomSettings.findOne();
    if (!settings) {
      settings = await RoomSettings.create({
        roomName: 'Happy Roomies Residence',
        currency: '₹',
        totalMonthlyRent: 0,
        defaultRentPerMember: 0,
        allowMemberAddExpense: true,
        allowMemberTaskUpdate: true,
      });
    }
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update room settings (Admin only)
// @route   PUT /api/settings
// @access  Private (Admin)
export const updateSettings = async (req, res) => {
  try {
    let settings = await RoomSettings.findOne();
    if (!settings) {
      settings = new RoomSettings();
    }

    const {
      roomName,
      currency,
      totalMonthlyRent,
      defaultRentPerMember,
      allowMemberAddExpense,
      allowMemberTaskUpdate,
    } = req.body;

    if (roomName !== undefined) settings.roomName = roomName.trim();
    if (currency !== undefined) settings.currency = currency.trim();
    if (totalMonthlyRent !== undefined) settings.totalMonthlyRent = Number(totalMonthlyRent) || 0;
    if (defaultRentPerMember !== undefined) settings.defaultRentPerMember = Number(defaultRentPerMember) || 0;
    if (allowMemberAddExpense !== undefined) settings.allowMemberAddExpense = Boolean(allowMemberAddExpense);
    if (allowMemberTaskUpdate !== undefined) settings.allowMemberTaskUpdate = Boolean(allowMemberTaskUpdate);

    await settings.save();

    return res.status(200).json({
      success: true,
      message: 'Room settings updated successfully',
      settings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
