const { Resend } = require('resend');
const config = require('../config/email.config');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOtpEmail = async (email, otp) => {
    try {
        await resend.emails.send({
            from:  'no-reply@purchase-finance.flashfund.in', 
            to: email,
            subject: 'Email Verification OTP',
            html: `<p>Your OTP for email verification Flashfund (pre-prod) is: <strong>${otp}</strong></p>`
        });
        return true;
    } catch (error) {
        console.error('Email send error:', error);
        return false;
    }
};

module.exports = { sendOtpEmail };