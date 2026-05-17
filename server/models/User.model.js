//Defines how a User is stored in mongoDB

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Userschema = new mongoose.Schema(
    {
        fullName:{
            type:  String,
            required:[true,'Full name is required'],
            trim:  true,
        },
        email:{
            type:   String,
            required:[true,'Email is required'],
            unique:true,  //no two users with same email
            lowercase:true, //always store as lowercase
            trim:true,
        },
        passwordHash:{
            type: String,
            required: true,
        },
        isActive:{
            type:Boolean,
            default:true,
        },
        lastLogin:{
            type:Date,
        },
        // Add inside UserSchema
        isAdmin:{
            type:    Boolean,
            default: false,   // Regular users are NOT admin by default
        },
        // For Google OAuth users, we store their Google ID and profile picture
        googleId: {
            type:   String,
            sparse: true,  // Allows multiple null values
             unique: true,
        },

        authProvider: {
            type:    String,
            enum:    ['local', 'google'],
            default: 'local',
        },

        profilePicture: {
            type:    String,
            default: null,
        },
        resetPasswordToken:{
            type:String,
        },
        resetPasswordExpires:{
            type:Date,
        }
    },
    {
        timestamps:true, // adds createdAt and updatedAt automatically
    }
);


//----Hash password Before Saving---
//this runs automatically every time a new user is saved
Userschema.pre('save',async function () {
    //Only hash if password was changed
    if(!this.isModified('passwordHash')) return ;
    if(this.authProvider === 'google') return; // Skip hashing for Google users 
    this.passwordHash = await bcrypt.hash(this.passwordHash,12);
    
});

//---method to check password on login---
Userschema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword,this.passwordHash);
};

module.exports = mongoose.model('User',Userschema);