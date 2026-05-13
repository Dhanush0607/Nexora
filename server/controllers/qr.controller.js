//Returns existing qr code loggedin user
const QRRecord = require('../models/QRRecord.model');
const QRService = require('../services/qr.service');
const logger = require('../utils/logger');

//GET /api/qr/my-qr
const getMyQR = async ( req, res) => {
    try{
        const userId = req.user._id;

        //find qr record for this user
        const qrRecord = await QRRecord.findOne({ userId });
        if(!qrRecord){
            return res.status(404).json({
                success:false,
                message:'No QR code found . Please Generate one',
            });
        }
        //Regenerate qr image from stored token
        const payload = QRService.assemblePayload(
            qrRecord.qrEncryptedToken,
            qrRecord.blockchainTxHash
        );
        const qrImage = await QRService.generateQRImage(payload);
        res.status(200).json({
            success:true,
            qrImage,
            selectedUtilities:qrRecord.selectedUtilities,
            scanCount:qrRecord.scanCount,
            createdAt:qrRecord.createdAt,
            blockchainTxHash:qrRecord.blockchainTxHash,
        });
    }catch (error){
        logger.error(`Get QR error : ${error.message}`);
        res.status(500).json({
            success:false,
            message:'Could not fetch QR code',
        });
    }
};

module.exports = { getMyQR };