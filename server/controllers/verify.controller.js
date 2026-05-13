//Qr scan and Blockchain verification - the heart of  nexora

const EncryptionService = require('../services/encryption.service');
const HashService = require('../services/hash.service');
const BlockchainService = require('../services/blockchain.service');
const QRService = require('../services/qr.service');
const UtilityProfile = require('../models/UtilityProfile.model');
const QRRecord = require('../models/QRRecord.model');
const logger = require('../utils/logger');

//POST /api/verify/scan
const scanAndVerify = async (req , res) => {
    try{
        const { token , txRef } = req.body;
        //--step 1:Validate input---
        if(!token){
            return res.status(400).json({
                success: false,
                verified: false,
                message: 'Invalid QR code, Token missing...',
            });
        }

        //--step 2 : Decrypt token to get userId-------
        //qr contains encryptedd userId --decrypt it---
        let userId;
        try{
            const qrRecord = await QRRecord.findOne({ qrEncryptedToken:token});

            if(!qrRecord){
                return res.status(404).json({
                    success: false,
                    verified: false,
                    message: ' QR code not found or expired...',
                });
            }

            //decrypt token using stored IV
            userId = QRService.decodeToken(token,qrRecord.qrTokenIV);
            logger.info(`QR Scanned for user:${userId}`);

        }catch (decryptError) {
           return res.status(400).json({
                success: false,
                verified: false,
                message: 'Invalid QR code, Cannot  decrypt token...',
            }); 
        }

        //step3:Fetch encrypted profile from mongoDB---
        const profile = await UtilityProfile.findOne({ userId });

        if(!profile){
            return res.status(404).json({
                success: false,
                verified:false,
                message:'No utility profile found for this qr.',
            });
        }

        //----step 4: Re-concatenate ciphertexts------------
        //Must follow Exact same order as QR generation
        let allCiphertexts = '';
        if(profile.selectedUtilities.includes('knockKnock') && profile.knockKnock){
            allCiphertexts += (profile.knockKnock.encryptedSessionLabel || '') +
            (profile.knockKnock.encryptedSessionDuration || '');
        }
        if(profile.selectedUtilities.includes('emergency') && profile.emergency){
            allCiphertexts += 
            (profile.emergency.encryptedName || '')+
            (profile.emergency.encryptedAge || '')+
            (profile.emergency.encryptedBloodGroup ||'')+
            (profile.emergency.encryptedEmergencyContact ||'')+
            (profile.emergency.encryptedMedicalNotes ||'');
        }
        if(profile.selectedUtilities.includes('smartParking') && profile.smartParking) {
            allCiphertexts +=
            (profile.smartParking.encryptedVehicleNumber || '') +
            (profile.smartParking.encryptedOwnerContact  || '') +
            (profile.smartParking.encryptedParkingArea   || '');
        }
        //----step 5: re-generate SHA-256 hash (free hash)------------
        const freeHash = HashService.generateHash(allCiphertexts);
        logger.info(`Free hash generated:${freeHash}`);

        //-----step 6: get stored hash from blockchain
        let storedHash;
        try{
            storedHash = await BlockchainService.getHash(userId.toString());
            logger.info(`Stored hash from blockchain:${storedHash}`);
        }catch(blockchainError){
            logger.error(`Blockchain gethash error:${blockchainError.message}`);
            return res.status(500).json({
                success:false,
                verified:false,
                message:'Could not verify with blockchain . try again..',
            });
        }
        //------step 7:Compare hashes-----
        const isVerified = (freeHash === storedHash);
        logger.info(`Hash comparision:${isVerified ? 'Match':'Mismatch'}`);

        // ---- step 8:Update scan count----------
        await QRRecord.findOneAndUpdate(
            { userId},
            {
                $inc:{ scanCount:1},
                lastScannedAt: new Date(),
            }
        );

        //step 9: If Tampered - return warning------
        if(!isVerified){
            logger.error(`Tamper detected fro user :${userId}`);
            return res.status(200).json({
                success:true,
                verified:false,
                tampered:true,
                message:'Data Integrity failure - This qr has been tampered with!',
                selectedUtilities:profile.selectedUtilities,
            });
        }
        //step10: decrypt all fields and return-------
        const decryptedData = {
            selectedUtilities:profile.selectedUtilities,
        };
        //Decrypt Knock Knock fields
        if(profile.selectedUtilities.includes('knockKnock')&&profile.knockKnock.encryptedSessionLabel){
            decryptedData.knockKnock = {
                sessionLabel:EncryptionService.decrypt(
                    profile.iv,
                    profile.knockKnock.encryptedSessionLabel
                ),
                sessionDuration:EncryptionService.decrypt(
                    profile.iv,
                    profile.knockKnock.encryptedSessionDuration
                ),
            };
        }
        //decrypt emergency 
        if(profile.selectedUtilities.includes('emergency') && profile.emergency.encryptedName){
            decryptedData.emergency = {
                name:EncryptionService.decrypt(
                    profile.iv,
                    profile.emergency.encryptedName
                ),
                age:EncryptionService.decrypt(
                    profile.iv,
                    profile.emergency.encryptedAge
                ),
                bloodGroup:EncryptionService.decrypt(
                    profile.iv,
                    profile.emergency.encryptedBloodGroup
                ),
                emergencyContact:EncryptionService.decrypt(
                    profile.iv,
                    profile.emergency.encryptedEmergencyContact
                ),
                medicalNotes:EncryptionService.decrypt(
                    profile.iv,
                    profile.emergency.encryptedMedicalNotes
                ),
            };
        }
        //decrypt smart parking
        if(profile.selectedUtilities.includes('smartParking') && profile.smartParking.encryptedVehicleNumber){
            decryptedData.smartParking = {
                vehicleNumber:EncryptionService.decrypt(
                    profile.iv,
                    profile.smartParking.encryptedVehicleNumber
                ),
                ownerContact:EncryptionService.decrypt(
                    profile.iv,
                    profile.smartParking.encryptedOwnerContact
                ),
                parkingArea:EncryptionService.decrypt(
                    profile.iv,
                    profile.smartParking.encryptedParkingArea
                ),
            };
        }

        logger.info(`Verification Successful for user:${userId}`);

        //step11 return verified data------------
        res.status(200).json({
            success:true,
            verified:true,
            tampered:false,
            message:'QR verified successfullt!! Data is authentic..',
            freeHash,
            storedHash,
            data:decryptedData,
        });

    }catch (error){
        logger.error(`Verification error:${error.message}`);
        res.status(500).json({
            success:false,
            verified:false,
            message:'Verification failed . Please try again...',
        });
    }
};

module.exports = { scanAndVerify };