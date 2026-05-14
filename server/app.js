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
const app = express();

app.use(helmet());//it adds security headers to every response
app.use(cors({
    origin:   process.env.CLIENT_URL || 'http://localhost:3000',
    credentials:true,
}));


app.use(express.json());
app.use(express.urlencoded({ extended:true}));

//routes
app.use('/api/auth',authRoutes);
app.use('/api/utility',utilityRoutes);
app.use('/api/qr',qrRoutes);
app.use('/api/verify',verifyRoutes);
app.use('/api/emergency',emergencyRoutes);
app.use('/api/parking',parkingRoutes);
app.use('/api/knockknock',knockknockRoutes);


app.get('/health',(req,res) => {
    res.status(200).json({
        success:true,
        message:'Nexora API is runnig!',
        version:'1.0.0',
        timestamp:new Date().toISOString(),
    });
});
//404 error handler
app.use((req,res) => {
    res.status(404).json({
        success:false,
        message:`Route ${req.originalUrl} not found`,
    });
});
//global error handler
app.use((err,req,res,next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success:false,
        message:err.message || 'Internal server error',
    });
});

module.exports = app;

