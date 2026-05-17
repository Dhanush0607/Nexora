//handles register, login,get profile

const { isAdmin } = require('../middleware/adminMiddleware');
const User = require('../models/User.model');
const TokenService = require('../services/token.service');
const logger = require('../utils/logger');
const {
    registerSchema,
    loginSchema
} = require('../validations/auth.validation');
const GoogleService = require('../services/google.service');
// Add at top
const crypto       = require('crypto');
const EmailService = require('../services/email.service');

// ── FORGOT PASSWORD ───────────────────────────────────────────
// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Step 1: Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address.',
      });
    }

    // Step 2: Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success even if user not found
    // This prevents email enumeration attacks
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If this email exists, a reset link has been sent.',
      });
    }

    // Step 3: Check if Google user
    if (user.authProvider === 'google') {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google Sign-In. No password to reset.',
      });
    }

    // Step 4: Generate reset token
    const resetToken  = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Step 5: Hash token before saving
    // (Never store plain reset tokens)
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Step 6: Save to database
    user.resetPasswordToken  = hashedToken;
    user.resetPasswordExpiry = resetExpiry;
    await user.save({ validateBeforeSave: false });

    // Step 7: Build reset URL
    // Frontend will show a form at this URL
    const resetURL = `${process.env.CLIENT_URL}/pages/reset-password.html?token=${resetToken}`;

    // Step 8: Send email
    try {
      await EmailService.sendPasswordResetEmail(
        user.email,
        resetURL,
        user.fullName
      );

      logger.info(`Password reset email sent to: ${email}`);

      res.status(200).json({
        success: true,
        message: 'Password reset link sent to your email!',
      });

    } catch (emailError) {
      // If email fails, clear the token
      user.resetPasswordToken  = undefined;
      user.resetPasswordExpiry = undefined;
      await user.save({ validateBeforeSave: false });

      logger.error(`Reset email failed: ${emailError.message}`);

      return res.status(500).json({
        success: false,
        message: 'Could not send reset email. Try again later.',
      });
    }

  } catch (error) {
    logger.error(`Forgot password error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.',
    });
  }
};

// ── RESET PASSWORD ────────────────────────────────────────────
// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Step 1: Validate input
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required.',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters.',
      });
    }

    // Step 2: Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Step 3: Find user with valid token
    const user = await User.findOne({
      resetPasswordToken:  hashedToken,
      resetPasswordExpiry: { $gt: Date.now() }, // Not expired
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Reset link is invalid or has expired.',
      });
    }

    // Step 4: Update password
    user.passwordHash        = newPassword; // Will be hashed by pre-save
    user.resetPasswordToken  = undefined;   // Clear reset token
    user.resetPasswordExpiry = undefined;
    await user.save();

    // Step 5: Issue new JWT token
    const jwtToken = TokenService.issueToken(user._id);

    logger.info(`Password reset successful for: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You are now logged in.',
      token:   jwtToken,
      user: {
        _id:      user._id,
        fullName: user.fullName,
        email:    user.email,
        isAdmin:  user.isAdmin,
      },
    });

  } catch (error) {
    logger.error(`Reset password error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Password reset failed. Please try again.',
    });
  }
};
// ── GOOGLE SIGN-IN ────────────────────────────────────────────
// POST /api/auth/google
const googleSignIn = async (req, res) => {
  try {
    const { idToken } = req.body;

    // Step 1: Validate token exists
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google token is required.',
      });
    }

    // Step 2: Verify token with Google
    let googleUser;
    try {
      googleUser = await GoogleService.verifyToken(idToken);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token. Please try again.',
      });
    }

    // Step 3: Check if email is verified by Google
    if (!googleUser.verified) {
      return res.status(401).json({
        success: false,
        message: 'Google email not verified.',
      });
    }

    // Step 4: Check if user already exists
    let user = await User.findOne({ email: googleUser.email });

    if (user) {
      // Existing user — update Google info if needed
      if (user.authProvider === 'local') {
        // User registered with email before
        // Link their Google account
        user.googleId       = googleUser.googleId;
        user.authProvider   = 'google';
        user.profilePicture = googleUser.picture;
        await user.save({ validateBeforeSave: false });
        logger.info(`Google account linked for: ${user.email}`);
      }
    } else {
      // New user — create account automatically
      user = await User.create({
        fullName:       googleUser.name,
        email:          googleUser.email,
        googleId:       googleUser.googleId,
        authProvider:   'google',
        profilePicture: googleUser.picture,
        passwordHash:   'GOOGLE_AUTH_NO_PASSWORD', // Placeholder
        isActive:       true,
      });
      logger.info(`New Google user registered: ${user.email}`);
    }

    // Step 5: Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated.',
      });
    }

    // Step 6: Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Step 7: Issue JWT token
    const token = TokenService.issueToken(user._id);

    logger.info(`Google sign-in successful: ${user.email}`);

    // Step 8: Return response
    res.status(200).json({
      success: true,
      message: 'Google sign-in successful!',
      token,
      user: {
        _id:            user._id,
        fullName:       user.fullName,
        email:          user.email,
        isAdmin:        user.isAdmin,
        authProvider:   user.authProvider,
        profilePicture: user.profilePicture,
      },
    });

  } catch (error) {
    // Show full error details
    console.error('FULL Google error:', error);
    logger.error(`Google sign-in error: ${error.message}`);
    logger.error(`Stack: ${error.stack}`);
  
    res.status(500).json({
      success: false,
      message: error.message,  // ← Show actual error
   });
  }
};

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
        logger.info(`New user Registered:${email}`);

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
        logger.error(`Register error:${error.message}`);
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
        //  Correct — use updateOne instead
            await User.updateOne(
            { _id: user._id },
            { lastLogin: new Date() }
            );
        //step 5: Issue JWT token
        const token = TokenService.issueToken(user._id);

        logger.info(`User logged in: ${email}`);

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
        logger.error(`Login error:${error.message}`);
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

module.exports = { register,login,getProfile,googleSignIn,forgotPassword,resetPassword };