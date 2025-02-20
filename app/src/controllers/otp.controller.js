const User = require('../models/user.model');
const { generateOtp } = require('../utils/otp.utils');
const { sendOtpEmail } = require('../utils/email.utils');

const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Email already verified' });
        }

        // Generate new OTP
        const otp = generateOtp();
        const otpExpiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.otp = {
            code: otp,
            expiryTime: otpExpiryTime
        };
        await user.save();

        // Send new OTP email
        await sendOtpEmail(email, otp);

        res.json({ message: 'New OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
    }
};

module.exports = {
    resendOtp
};