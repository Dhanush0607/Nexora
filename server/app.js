const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { messaging } = require('firebase-admin');
const { version } = require('joi');
const authRoutes = require('./routes/auth.routes');
const utilityRoutes = require('./routes/utility.routes');
const qrRoutes = require('./routes/qr.routes');
const verifyRoutes = require('./routes/verify.routes');
const emergencyRoutes = require('./routes/emergency.routes');
const parkingRoutes = require('./routes/parking.routes');
const knockknockRoutes = require('./routes/knockknock.routes');
const adminRoutes = require('./routes/admin.routes');
//middleware
const { authLimiter, apiLimiter, verifyLimiter } = require('./middleware/rateLimiter');
const { notFound,errorHandler} = require('./middleware/errorHandler');
const app = express();

app.use(helmet());//it adds security headers to every response
// Required for Google Sign-In popup to work
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.setHeader('Permissions-Policy','identity-credentials-get=*');
  next();
});

// Replace existing cors setup with this
app.use(cors({
  origin: function(origin, callback) {
    // Allow these origins
    const allowedOrigins = [
      'http://127.0.0.1:5500',
      'http://localhost:5500',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5000',

    ];

    // Allow requests with no origin (mobile apps, Thunder Client)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended:true}));

//routes
app.use('/api',apiLimiter);
app.use('/api/auth',authRoutes);
app.use('/api/utility',utilityRoutes);
app.use('/api/qr',qrRoutes);
app.use('/api/verify',verifyRoutes);
app.use('/api/emergency',emergencyRoutes);
app.use('/api/parking',parkingRoutes);
app.use('/api/knockknock',knockknockRoutes);
app.use('/api/admin',adminRoutes);

app.get('/health',(req,res) => {
    res.status(200).json({
        success:true,
        message:'Nexora API is runnig!',
        version:'1.0.0',
        timestamp:new Date().toISOString(),
    });
});
// error handler
app.use(notFound);
app.use(errorHandler);

module.exports = app;

