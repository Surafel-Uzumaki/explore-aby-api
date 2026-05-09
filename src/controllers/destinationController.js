const db = require('../config/db');

// Get all destinations
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM destinations WHERE is_active = TRUE',
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add new destination
exports.create = async (req, res) => {
  try {
    const { title, description, price, duration, image_url, location } =
      req.body;
    const [result] = await db.execute(
      'INSERT INTO destinations (title, description, price, duration, image_url, location, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        title,
        description,
        price,
        duration,
        image_url || 'https://via.placeholder.com/600x400',
        location,
        1,
      ], // 1 = your admin id
    );
    res.json({
      success: true,
      id: result.insertId,
      message: 'Destination added!',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update destination
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, duration, image_url, location } =
      req.body;
    await db.execute(
      'UPDATE destinations SET title=?, description=?, price=?, duration=?, image_url=?, location=? WHERE id=?',
      [title, description, price, duration, image_url, location, id],
    );
    res.json({ success: true, message: 'Destination updated!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete destination
// Hard delete (completely removes from database)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM destinations WHERE id = ?', [id]);
    console.log(`✅ Hard deleted destination ID: ${id}`);
    res.json({ success: true, message: 'Destination permanently deleted!' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ message: err.message });
  }
};
