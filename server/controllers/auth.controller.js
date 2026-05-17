//handles register, login,get profile

const { isAdmin } = require('../middleware/adminMiddleware');
const User = require('../models/User.model');
const TokenService = require('../services/token.service');
const Logger = require('../utils/logger');
const {
    registerSchema,
    loginSchema
} = require('../validations/auth.validation');


//-----Register------------
//POST /api/auth/register
const register = async (req,res) => {
    try{
        //step1 : validate input
        const { error, value } = registerSchema.validate(req.body);
        if(error){
            return res.status(400).json({
                success:false,
                message:error.details[0].message,
            });
        }
        const { fullName, email,password} = value;
        //step2: Check if email already exists
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({
                success:false,
                message:'email already registered.Please login',
            });
        }
        //step3-Create new user
        //passwordHash field triggers bcrypt hashing automatically(see model)
        const user = await User.create({
            fullName,
            email,
            passwordHash:password,
        });
        
        //step4-Issue JWT token
        const token = TokenService.issueToken(user._id);
        Logger.info(`New user Registered:${email}`);

        //step 5 :send Response
        res.status(201).json({
            success:true,
            message:'Account Created successfully',
            token,
            user:{
                _id:user._id,
                fullName:user.fullName,
                email:user.email,
                isAdmin:user.isAdmin,
            },
        });
    }catch(error){
        Logger.error(`Register error:${error.message}`);
        res.status(500).json({
            success:false,
            message:'Registration failed.please try again',
        });
    }
};


//-------------Login----------------------------
//POST /api/auth/login
const login = async (req,res) => {
    try{
        //step 1: Validate input
        const {error, value} = loginSchema.validate(req.body);
        if(error){
            return res.status(400).json({
                success:false,
                message:error.details[0].message,
            });
        }
        const { email, password} = value;
        
        //step2:find user by email
        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({
                success:false,
                message:'Invalid email or password',
            });
        }

        //step3:Check password
        const isMatch = await user.comparePassword(password);
        if(!isMatch){
            return res.status(401).json({
                success:false,
                message:'Invalid Email or password',
            });
        }

        //step 4: update last login time
        // ✅ Correct — use updateOne instead
            await User.updateOne(
            { _id: user._id },
            { lastLogin: new Date() }
            );
        //step 5: Issue JWT token
        const token = TokenService.issueToken(user._id);

        Logger.info(`User logged in: ${email}`);

        //step6: Send Response
        res.status(200).json({
            success:true,
            message:'Login Successfull',
            token,
            user:{
                _id:user._id,
                fullName:user.fullName,
                email:user.email,
                isAdmin:user.isAdmin,
            },
        });

    } catch(error){
        Logger.error(`Login error:${error.message}`);
        res.status(500).json({
            success:false,
            message:'Login failed.Please try again',
        });
    }
};


//------------get Profile----------------
//GET /api/auth/profile (protected route)
const getProfile = async (req,res) => {
    try{
        //req.user is set by authMiddleware
        res.status(200).json({
            success:true,
            user:{
                _id:req.user._id,
                fullName:req.user.fullName,
                email:req.user.email,
                createdAt:req.user.createdAt,
                lastLogin:req.user.lastLogin,
            },
        });
    } catch(error){
        res.status(500).json({
            success:false,
            message:'Could not fetch profile',
        });
    }
};

module.exports = { register,login,getProfile};