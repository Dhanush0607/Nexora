//Assembles QR payload and generates QR image
//Qr contains ONLY encrypted token + TX reference - never personal data

const   QRCode = require('qrcode');
const crypto = require('crypto');
const EncryptionService = require('./encryption.service');

const QRService = {

    //Encrypts userId to create a secure token for qr
    generateToken(userId){
        const encrypted = EncryptionService.encrypt(userId.toString());
        return {
            token:encrypted.ciphertext,
            iv:encrypted.iv,
        };
    },

    //Decrypts token back to userId
    decodeToken(token,iv){
        return EncryptionService.decrypt(iv,token);
    },
    //Assembles the QR payload object
    //This is what gets encoded into the QR image
    assemblePayload(token,txRef){
        return JSON.stringify({
            token,//Encrypted userId
            txRef,//Blockchain TX hash(or 'pending' for now)
            app:'nexora',//Identifies this as a Nexora Qr
        });
    },

    //Generates QR code image as base64 string
    //Frontend Can display this directly as <img src="data:img/png;base64,....">
    async generateQRImage(payload){
        const qrBase64 = await QRCode.toDataURL(payload,{
            errorCorrectionLevel:'H', //high error correlation
            width:300,
            margin:2,
            color:{
                dark:'#000000',
                light:'#FFFFFF',
            },
        });
        return qrBase64; //Return "data:image/png;base64,iVBORw0..."
    },
};

module.exports = QRService;