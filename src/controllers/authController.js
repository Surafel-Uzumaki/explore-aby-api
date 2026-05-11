const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { registerSchema, loginSchema } = require('../middleware/validate');
const axios = require('axios');

const GEEZ_TOKEN = process.env.GEEZ_SMS_TOKEN;
const GEEZ_SHORTCODE = process.env.GEEZ_SMS_SHORTCODE_ID;

// ==================== SEND CUSTOM OTP VIA GEEZ SMS ====================
const sendRealOTP = async (phone, otp) => {
  try {
    const etPhone = phone.startsWith('0') ? '251' + phone.substring(1) : phone;
    const message = `Your Explore Abyssinia OTP is ${otp}. Valid for 10 minutes. Do not share it.`;
    await axios.get('https://api.geezsms.com/api/v1/sms/send', {
      params: {
        token: GEEZ_TOKEN,
        shortcode_id: GEEZ_SHORTCODE,
        phone: etPhone,
        msg: message,
      },
    });
  } catch (err) {
    console.error('❌ Geez SMS failed:', err.response?.data || err.message);
  }
};

// ==================== REGISTER ====================
exports.register = async (req, res) => {
  try {
    const { full_name, phone, email, password } = registerSchema.parse(
      req.body,
    );
    const [existing] = await db.execute(
      'SELECT id FROM users WHERE phone = ?',
      [phone],
    );
    if (existing.length > 0)
      return res.status(400).json({ message: 'Phone already registered' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await db.execute(
      'INSERT INTO otps (phone, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)',
      [phone, otp, 'signup', expires],
    );

    await sendRealOTP(phone, otp);

    res.json({
      success: true,
      message: 'OTP sent to your phone. Check your SMS!',
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err });
  }
};

// ==================== VERIFY OTP ====================
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp, full_name, email, password } = req.body;
    const [rows] = await db.execute(
      `SELECT * FROM otps
       WHERE phone = ?
       AND otp_code = ?
       AND purpose = 'signup'
       AND is_used = FALSE
       AND expires_at > NOW()`,
      [phone, otp],
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await db.execute('UPDATE otps SET is_used = TRUE WHERE id = ?', [
      rows[0].id,
    ]);

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.execute(
      'INSERT INTO users (full_name, phone, email, password, is_phone_verified) VALUES (?, ?, ?, ?, TRUE)',
      [full_name, phone, email || null, hashedPassword],
    );

    res.json({
      success: true,
      message: 'Registration complete! You can now login.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== LOGIN ====================
exports.login = async (req, res) => {
  try {
    const { identifier, password } = loginSchema.parse(req.body);
    const [users] = await db.execute(
      'SELECT * FROM users WHERE phone = ? OR email = ?',
      [identifier, identifier],
    );

    if (users.length === 0)
      return res.status(400).json({ message: 'User not found' });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Wrong password' });

    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' },
    );

    const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_SECRET, {
      expiresIn: '7d',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, accessToken, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==================== UPDATE PROFILE (NEW) ====================
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, email, phone } = req.body;
    const userId = req.user.id;

    // Check if phone is already taken by another user
    if (phone) {
      const [existing] = await db.execute(
        'SELECT id FROM users WHERE phone = ? AND id != ?',
        [phone, userId],
      );
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Phone number already in use' });
      }
    }

    // Check if email is already taken by another user
    if (email) {
      const [existing] = await db.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId],
      );
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    const [result] = await db.execute(
      `UPDATE users 
       SET full_name = COALESCE(?, full_name),
           email = COALESCE(?, email),
           phone = COALESCE(?, phone)
       WHERE id = ?`,
      [full_name, email, phone, userId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch updated user
    const [updatedUser] = await db.execute(
      'SELECT id, full_name, email, phone, role FROM users WHERE id = ?',
      [userId],
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};
