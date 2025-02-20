const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { generateOtp, isOtpValid } = require('../utils/otp.utils');
const { sendOtpEmail } = require('../utils/email.utils');

const signup = async (req, res) => {
    try {
        const { email, phone, password } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with these mail or pass' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Generate OTP
        const otp = generateOtp();
        const otpExpiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create user
        const user = new User({
            email,
            phone,
            password: hashedPassword,
            otp: {
                code: otp,
                expiryTime: otpExpiryTime
            }
        });

        await user.save();

        // Send OTP email
        await sendOtpEmail(email, otp);

        res.status(201).json({ message: 'User created. Please verify your email.' });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!isOtpValid(user.otp.code, otp, user.otp.expiryTime)) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.otp = undefined;
        await user.save();

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.isVerified) {
            return res.status(400).json({ message: 'Please verify your email first' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token,userId: user._id  });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
    }
};

module.exports = {
    signup,
    verifyEmail,
    login
};