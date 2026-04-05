//issues and varifies JWT tokens

const jwt = require('jsonwebtoken');

const TokenService = {
    //call this after successfull login/register
    //returns a JWT string like "eyJhb.."

    issueToken(userId){
        return jwt.sign(
            { id: userId},
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d'}
        );
    },

    //Call this to varify a token sent from frontend
    // Returns the decoded payload { id,iat,exp} or throws error

    verifyToken(token){
        return jwt.verify(token,process.env.JWT_SECRET);
    },
};

module.exports = TokenService;