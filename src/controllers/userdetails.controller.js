const UserDetails = require('../models/userdetails.model');

class UserDetailsController {
    static async submitForm(req, res) {
        try {
            const { userId } = req.params;

            const userDetailsData = {
                user: userId,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                dob: new Date(req.body.dob),
                gender: req.body.gender,
                pan: req.body.pan,
                contactNumber: req.body.contactNumber,
                email: req.body.email,
                officialEmail: req.body.officialEmail,
                employmentType: req.body.employmentType,
                endUse: req.body.endUse,
                income: req.body.income,
                companyName: req.body.companyName,
                udyamNumber: req.body.udyamNumber,
                address: {
                    line1: req.body.addressL1,
                    line2: req.body.addressL2,
                    city: req.body.city,
                    state: req.body.state,
                    pincode: req.body.pincode
                },
                // aa_id: req.body.aa_id,
                bureauConsent: req.body.bureauConsent,
                lastUpdated: new Date()
            };

            const userDetails = await UserDetails.findOneAndUpdate(
                { user: userId },
                { $set: userDetailsData },
                { 
                    new: true,
                    upsert: true,
                    runValidators: true
                }
            );

            res.status(200).json({
                success: true,
                message: userDetails.isNew ? 'User details created' : 'User details updated',
                data: userDetails
            });

        } catch (error) {
            console.error('User details submission failed:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    static async checkUserId(req, res) {
        try {
            const { userId } = req.params;

            // Check if the user ID exists in UserDetails
            const userDetails = await UserDetails.findOne({ user: userId });

            if (userDetails) {
                return res.status(200).json({
                    message: 'User ID exists in UserDetails',
                    userDetails
                });
            } else {
                return res.status(404).json({
                    message: 'User ID not found in UserDetails'
                });
            }
        } catch (error) {
            console.error('Error checking user ID:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = UserDetailsController;