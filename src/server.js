const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Import routes
const authRoutes = require('./routes/authRoutes');
const destinationRoutes = require('./routes/destinationRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/bookings', bookingRoutes);
// Test route
app.get('/', (req, res) => {
  res.send('Explore Abyssinia Backend is running strong! 🇪🇹');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
