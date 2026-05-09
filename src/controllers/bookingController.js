const db = require('../config/db');
const axios = require('axios');

const GEEZ_TOKEN = process.env.GEEZ_SMS_TOKEN;
const GEEZ_SHORTCODE = process.env.GEEZ_SMS_SHORTCODE_ID;

// Send real SMS using Geez SMS
const sendConfirmationSMS = async (phone, message) => {
  try {
    const etPhone = phone.startsWith('0') ? '251' + phone.substring(1) : phone;

    await axios.get('https://api.geezsms.com/api/v1/sms/send', {
      params: {
        token: GEEZ_TOKEN,
        shortcode_id: GEEZ_SHORTCODE,
        phone: etPhone,
        msg: message,
      },
    });

    console.log(`✅ SMS sent successfully to ${etPhone}`);
  } catch (err) {
    console.error('❌ SMS failed:', err.response?.data || err.message);
  }
};

exports.createBooking = async (req, res) => {
  try {
    const {
      destination_id,
      departure_date,
      return_date,
      people,
      total_price,
      user_id,
    } = req.body;

    if (!user_id || !departure_date) {
      return res
        .status(400)
        .json({
          message: 'Missing required fields (user_id or departure_date)',
        });
    }

    // Get the user's real phone number from the database
    const [userRows] = await db.execute(
      'SELECT phone FROM users WHERE id = ?',
      [user_id],
    );
    if (userRows.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }
    const userPhone = userRows[0].phone;

    // Insert the booking
    const [result] = await db.execute(
      `INSERT INTO bookings 
       (user_id, destination_id, departure_date, return_date, total_price, status) 
       VALUES (?, ?, ?, ?, ?, 'confirmed')`,
      [
        user_id,
        destination_id,
        departure_date,
        return_date || null,
        total_price,
      ],
    );

    // Send SMS to the ACTUAL user
    const smsMessage = `Dear customer, your booking is confirmed! Booking ID: ${result.insertId}. Going: ${departure_date} | Return: ${return_date || 'Open'}. Thank you for choosing Explore Abyssinia 🇪🇹`;

    await sendConfirmationSMS(userPhone, smsMessage);

    res.json({
      success: true,
      message: 'Booking confirmed successfully! SMS sent to your phone.',
      bookingId: result.insertId,
    });
  } catch (err) {
    console.error('Booking Error:', err);
    res.status(500).json({ message: err.message });
  }
};
