//Main form submission-encrypts data,hashes it, generates qr

const EncryptionService = require('../services/encryption.service');
const HashService = require('../services/hash.service');
const QRService = require('../services/qr.service');
const UtilityProfile = require('../models/UtilityProfile.model');
const QRRecord = require('../models/QRRecord.model');
const logger = require('../utils/logger');
const crypto = require('crypto');
const BlockchainService = require('../services/blockchain.service');

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
            const encLabel    = EncryptionService.encryptWithIV(knockKnock.sessionLabel    || 'My Door', iv);
            const encDuration = EncryptionService.encryptWithIV(knockKnock.sessionDuration || '10',      iv);

            profileData.knockKnock = {
                encryptedSessionLabel:    encLabel,
                encryptedSessionDuration: encDuration,
            };
            allCiphertexts += encLabel + encDuration;

        }

        //encrypt emergency fields
        if(selectedUtilities.includes('emergency') && emergency){
            const encName    = EncryptionService.encryptWithIV(emergency.name             || '', iv);
            const encAge     = EncryptionService.encryptWithIV(emergency.age              || '', iv);
            const encBlood   = EncryptionService.encryptWithIV(emergency.bloodGroup       || '', iv);
            const encContact = EncryptionService.encryptWithIV(emergency.emergencyContact || '', iv);
            const encNotes   = EncryptionService.encryptWithIV(emergency.medicalNotes     || '', iv);

            profileData.emergency = {
                encryptedName:             encName,
                encryptedAge:              encAge,
                encryptedBloodGroup:       encBlood,
                encryptedEmergencyContact: encContact,
                encryptedMedicalNotes:     encNotes,
            };
            allCiphertexts += encName + encAge + encBlood + encContact + encNotes;
        }

        //Encrypt smart parking fields
        if(selectedUtilities.includes('smartParking') && smartParking){
            const encVehicle  = EncryptionService.encryptWithIV(smartParking.vehicleNumber || '', iv);
            const encContact2 = EncryptionService.encryptWithIV(smartParking.ownerContact  || '', iv);
            const encArea     = EncryptionService.encryptWithIV(smartParking.parkingArea   || '', iv);

            profileData.smartParking = {
                encryptedVehicleNumber: encVehicle,
                encryptedOwnerContact:  encContact2,
                encryptedParkingArea:   encArea,
            };
            allCiphertexts += encVehicle + encContact2 + encArea;
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
        //------step6: store hash on blockchain
        let blockchainTxHash = 'pending';
        try{
            blockchainTxHash = await BlockchainService.storeHash(
                userId.toString(),
                dataHash
            );
            logger.info(`Blockchain TX:${blockchainTxHash}`);
        } catch(blockchainError){
            logger.error(`Blockchain error:${blockchainError.message}`);
            blockchainTxHash = 'pending';
        }

        //-----step 7: generate QR token------------
        const { token, iv:tokenIv} = QRService.generateToken(userId);

        //-----step 8: assemble QR payload---------
        //txRef is 'pending' until blockchain is integrated in phase 4
        const payload = QRService.assemblePayload(token,blockchainTxHash);

        //----step 9 : generate QR image------------
        const qrImage = await QRService.generateQRImage(payload);

        //----step 10 : Save qr record to mongoDB------------

        await QRRecord.findOneAndUpdate(
            {userId},
            {
                userId,
                dataHashSnapshot:dataHash,
                qrEncryptedToken:token,
                qrTokenIV:tokenIv,
                selectedUtilities,
                blockchainTxHash,
                isExpired:false,
                scanCount:0,
            },
            { upsert:true, new:true}
        );
        logger.info(`QR generated for user : ${userId}`);
        //-----step 11 : Return QR image to frontend-------------
        res.status(200).json({
            success:true,
            message:'QR Code generated successfully',
            qrImage, //base64 image string
            dataHash, //SHA-256 hash
            blockchainTxHash,
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