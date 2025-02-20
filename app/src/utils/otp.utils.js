const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const isOtpValid = (storedOtp, userOtp, expiryTime) => {
    return storedOtp === userOtp && new Date() < expiryTime;
};

module.exports = {
    generateOtp,
    isOtpValid
};