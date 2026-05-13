// Stores QR code metadata — blockchain TX, token, scan count
const mongoose = require('mongoose');

const QRRecordSchema = new mongoose.Schema(
    {
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User',
            required:true,
        },
        //Blockchain info (filled after phase 4)
        blockchainTxHash:{
            type:String,
            default:'pending',//will update after blockchain integration
        },
        

        //SHA-256 hash snapshot at time of QR generation
        dataHashSnapshot:{
            type:String,
            required:true,
        },

        //encrypted token embedded in QR Code
        qrEncryptedToken:{
            type:String,
            required:true,
        },
        qrTokenIV:{
            type:String,
            required:true,
        },

        //which utilities are active in this qr
        selectedUtilities:{
            type:[String],
            default:[],
        },

        //Qr usage tracking
        scanCount:{
            type:Number,
            default:0,
        },
        isExpired:{
            type:Boolean,
            default:false,
        },
        
        //QR expiry (optional - 30 days by default)
        expiresAt:{
            type:Date,
            default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },

        lastScannedAt:{
            type:Date,
        },
    },
    {
        timestamps:true,
    }
);

module.exports = mongoose.model('QRRecord',QRRecordSchema);