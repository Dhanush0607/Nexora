//stores all sensitive user data - always encrypted , never plain text

const mongoose = require('mongoose');

const UtilityProfileSchema = new mongoose.Schema(
    {
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User',
            required:true,
            unique:true,//One profile per user
        },
        //which utilities the user selected
        selectedUtilities:{
            type:[String], //e.g ['emergency','smartparking','knockKnock']
            default:[],
        },
        //Shared IV for all encrypted fields in this profile
        iv:{
            type:String,
            required:true,
        },

        //_____________-knock-Knock fields______________________-
        knockKnock:{
            encryptedSessionLabel:{type:String},
            encryptedSessionDuration:{type:String},
        },
        //---------------emergency fields------------------
        emergency:{
            encryptedName:{type:String},
            encryptedAge:{type:String},
            encryptedBloodGroup:{type:String},
            encryptedEmergencyContact:{type:String},
            encryptedMedicalNotes:{type:String},
        },
        //--------------Smart-Parking fields--------------
        smartParking:{
            encryptedVehicleNumber:{type:String},
            encryptedOwnerContact:{type:String},
            encryptedParkingArea:{type:String},
        },
    },
    {
        timestamps:true,
    }
);

module.exports = mongoose.model('UtilityProfile',UtilityProfileSchema);