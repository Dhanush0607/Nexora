//Main form submission-encrypts data,hashes it, generates qr

const EncryptionService = require('../services/encryption.service');
const HashService = require('../services/hash.service');
const QRService = require('../services/qr.service');
const UtilityProfile = require('../models/UtilityProfile.model');
const QRRecord = require('../models/QRRecord.model');
const logger = require('../utils/logger');
const crypto = require('crypto');


//POST/api/utility/submit
const submitUtilityData = async (req,res) => {
    try{
        const userId = req.user._id;
        const { selectedUtilities,knockKnock,emergency,smartParking} = req.body;

        //---step 1:Validate at least one utility selected---
        if(!selectedUtilities || selectedUtilities.length === 0){
            return res.status(400).json({
                success:false,
                message:'Please select at least one utility',
            });
        }
        //----step 2: generate a shared IV for this profile-----
        const iv = crypto.randomBytes(16).toString('hex');

        //----step 3: encrypt all fields based on selection ----
        const profileData = {
            userId,
            selectedUtilities,
            iv,
            knockKnock:{},
            emergency:{},
            smartParking:{},
        };
        //Concatenated ciphertexts for hashing
        let allCiphertexts = '';

        //Encrypt knockknock fieldsb

        if(selectedUtilities.includes('knockKnock') && knockKnock){
            const label = EncryptionService.encrypt(knockKnock.sessionLabel || 'My Door');
            const duration = EncryptionService.encrypt(knockKnock.sessionDuration || '10');

            profileData.knockKnock = {
                encryptedSessionLabel:label.ciphertext,
                encryptedSessionDuration:duration.ciphertext,
            };
            allCiphertexts += label.ciphertext + duration.ciphertext;
        }

        //encrypt emergency fields
        if(selectedUtilities.includes('emergency') && emergency){
            const name = EncryptionService.encrypt(emergency.name || '');
            const age = EncryptionService.encrypt(emergency.age || '');
            const blood = EncryptionService.encrypt(emergency.bloodGroup || '');
            const contact = EncryptionService.encrypt(emergency.emergencyContact || '');
            const notes = EncryptionService.encrypt(emergency.medicalNotes || '');

            profileData.emergency = {
                encryptedName: name.ciphertext,
                encryptedAge:age.ciphertext,
                encryptedBloodGroup:blood.ciphertext,
                encryptedEmergencyContact:contact.ciphertext,
                encryptedMedicalNotes:notes.ciphertext,

            };
            allCiphertexts += name.ciphertext + age.ciphertext + blood.ciphertext + contact.ciphertext + notes.ciphertext;
        }

        //Encrypt smart parking fields
        if(selectedUtilities.includes('smartParking') && smartParking){
            const vehicle = EncryptionService.encrypt(smartParking.vehicleNumber || '');
            const contact = EncryptionService.encrypt(smartParking.ownerContact || '');
            const area = EncryptionService.encrypt(smartParking.parkingArea || '');

            profileData.smartParking = {
                encryptedVehicleNumber:vehicle.ciphertext,
                encryptedOwnerContact:contact.ciphertext,
                encryptedParkingArea:area.ciphertext,
            };
            allCiphertexts += vehicle.ciphertext + contact.ciphertext + area.ciphertext;
        }

        //-----step 4: generate SHA-256 hash of all ciphertexts-----
        const dataHash = HashService.generateHash(allCiphertexts);
        const hashBytes32 = HashService.hexToBytes32(dataHash);

        //----------step 5:save encrypted profile to MongoDB
        //update if exists , create if not
        await UtilityProfile.findOneAndUpdate(
            {userId},
            profileData,
            {upsert:true,new:true}
        );

        //-----step 6: generate QR token------------
        const { token, iv:tokenIv} = QRService.generateToken(userId);

        //-----step 7: assemble QR payload---------
        //txRef is 'pending' until blockchain is integrated in phase 4
        const payload = QRService.assemblePayload(token,'pending');

        //----step 8 : generate QR image------------
        const qrImage = await QRService.generateQRImage(payload);

        //----step 9 : Save qr record to mongoDB------------

        await QRRecord.findOneAndUpdate(
            {userId},
            {
                userId,
                dataHashSnapshot:dataHash,
                qrEncryptedToken:token,
                qrTokenIV:tokenIv,
                selectedUtilities,
                blockchainTxHash:'pending',
                isExpired:false,
                scanCount:0,
            },
            { upsert:true, new:true}
        );
        logger.info(`QR generated for user : ${userId}`);
        //-----step 10 : Return QR image to frontend-------------
        res.status(200).json({
            success:true,
            message:'QR Code generated successfully',
            qrImage, //base64 image string
            dataHash, //SHA-256 hash
            selectedUtilities,
        });
    } catch (error){
        logger.error(`QR generation error : ${error.message}`);
        res.status(500).json({
            success:false,
            message:'QR generation failed.Please try again',
        });
    }
};

module.exports = { submitUtilityData};