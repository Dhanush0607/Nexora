//Protects routes -- checks JWT token on every request

const TokenService = require('../services/token.service');
const User = require('../models/User.model');

const protect = async (req,res,next) => {
    try{
        //step1: check if token exists in request header
        const authHeader = req.headers.authorization;
        
        
        if(!authHeader || !authHeader.startsWith('Bearer ')){
            return res.status(401).json({
                success:false,
                message:'Access denied.No token provided.',
            });
        }

        //step 2- extraxt token (remove "Bearer " prefix)
        const token = authHeader.split(' ')[1];

        //step 3- Verify Token Is valid and not expired
        const decoded = TokenService.verifyToken(token);

        //step 4- find user in database
        const user = await User.findById(decoded.id).select('-passwordHash');

        if(!user){
            return res.status(401).json({
                success: false,
                message:'User no longer exists.',
            });
        }

        //step 5:Attach user to request object
        //now any controller can access req.user
        req.user = user;
        next();
    } catch(error){
        return res.status(401).json({
            success:false,
            message:'Invalid or expired token.Please login again.',
        });
    }
};

module.exports = { protect };