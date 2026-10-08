import User from '../models/User.js';

export const syncAdminAccount = async () => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@roommate.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@Room2026';
    const adminName = process.env.ADMIN_NAME || 'Room Admin';

    let admin = await User.findOne({ role: 'admin' });

    if (!admin) {
      // Check if user with this email exists as a member
      admin = await User.findOne({ email: adminEmail });
    }

    if (!admin) {
      admin = new User({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        roomNo: 'Admin-HQ',
        isActive: true,
      });
      await admin.save();
      console.log(`[Admin Seed] Admin account created successfully with email: ${adminEmail}`);
    } else {
      // Ensure role is admin
      admin.role = 'admin';
      admin.email = adminEmail;
      admin.name = adminName;
      // Update password to match current .env setting
      admin.password = adminPassword;
      await admin.save();
      console.log(`[Admin Seed] Admin account synced with .env config (${adminEmail})`);
    }
  } catch (error) {
    console.error(`[Admin Seed Error]: ${error.message}`);
  }
};
