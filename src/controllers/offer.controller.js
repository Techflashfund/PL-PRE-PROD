const SelectTwo = require('../models/selecttwo.model');

class OffersController {
    static async getOffers(req, res) {
        try {
            const { transactionId } = req.body;

            if (!transactionId) {
                return res.status(400).json({ error: 'Transaction ID is required' });
            }

            const selectTwoRecords = await SelectTwo.find({ transactionId });

            if (!selectTwoRecords.length) {
                return res.status(404).json({ error: 'No offers found' });
            }
            const validRecords = selectTwoRecords.filter(record => record.onselectRequest);

            if (!validRecords.length) {
                return res.status(404).json({ error: 'No valid offers found' });
            }

            const offers = validRecords.map(record => {
                const onselectRequest = record.onselectRequest;
                const provider = onselectRequest.message.order.provider;
                const items = onselectRequest.message.order.items;
                const quote = onselectRequest.message.order.quote;
                
                // Extract provider image URL if available
                const providerImages = provider.descriptor.images || [];
                const imageUrl = providerImages.length > 0 ? providerImages[0].url : null;
                
                // Find loan information from items
                const loanItem = items.find(item => item.descriptor.code === "PERSONAL_LOAN");
                const loanInfo = loanItem?.tags?.find(tag => tag.descriptor.code === "LOAN_INFO");
                
                // Extract loan details
                const getLoanValue = (code) => {
                    const item = loanInfo?.list?.find(item => item.descriptor.code === code);
                    return item ? item.value : null;
                };
                
                // Extract principal amount from quote breakup
                const principalAmount = quote?.breakup?.find(item => item.title === "PRINCIPAL")?.price?.value || null;
                const interestAmount = quote?.breakup?.find(item => item.title === "INTEREST")?.price?.value || null;
                const processingFeeAmount = quote?.breakup?.find(item => item.title === "PROCESSING_FEE")?.price?.value || null;
                const netDisbursedAmount = quote?.breakup?.find(item => item.title === "NET_DISBURSED_AMOUNT")?.price?.value || null;
                const insuranceCharges = quote?.breakup?.find(item => item.title === "INSURANCE_CHARGES")?.price?.value || null;
                const otherCharges = quote?.breakup?.find(item => item.title === "OTHER_CHARGES")?.price?.value || null;
                
                // Get contact information
                const contactInfo = provider.tags?.find(tag => tag.descriptor.code === "CONTACT_INFO");
                const getContactValue = (code) => {
                    const item = contactInfo?.list?.find(item => item.descriptor.code === code);
                    return item ? item.value : null;
                };

                return {
                    lenderId: provider.id,
                    lenderName: provider.descriptor.name,
                    lenderShortDesc: provider.descriptor.short_desc,
                    lenderLongDesc: provider.descriptor.long_desc,
                    lenderImageUrl: imageUrl,
                    
                    // Loan details
                    principalAmount: principalAmount,
                    loanAmount: quote?.price?.value || null,
                    interestRate: getLoanValue("INTEREST_RATE"),
                    interestRateType: getLoanValue("INTEREST_RATE_TYPE"),
                    term: getLoanValue("TERM"),
                    repaymentFrequency: getLoanValue("REPAYMENT_FREQUENCY"),
                    installmentAmount: getLoanValue("INSTALLMENT_AMOUNT"),
                    numberOfInstallments: getLoanValue("NUMBER_OF_INSTALLMENTS_OF_REPAYMENT"),
                    
                    // Fees and charges
                    processingFee: processingFeeAmount,
                    applicationFee: getLoanValue("APPLICATION_FEE"),
                    foreclosureFee: getLoanValue("FORECLOSURE_FEE"),
                    delayPenaltyFee: getLoanValue("DELAY_PENALTY_FEE"),
                    otherPenaltyFee: getLoanValue("OTHER_PENALTY_FEE"),
                    interestRateConversionCharge: getLoanValue("INTEREST_RATE_CONVERSION_CHARGE"),
                    
                    // Additional information
                    annualPercentageRate: getLoanValue("ANNUAL_PERCENTAGE_RATE"),
                    coolOffPeriod: getLoanValue("COOL_OFF_PERIOD"),
                    
                    // Financial details
                    interestAmount: interestAmount,
                    netDisbursedAmount: netDisbursedAmount,
                    insuranceCharges: insuranceCharges,
                    otherCharges: otherCharges,
                    
                    // Links
                    termsAndConditionsLink: getLoanValue("TNC_LINK"),
                    keyFactsStatementLink: getLoanValue("KFS_LINK"),
                    
                    // Contact information
                    customerSupportEmail: getContactValue("CUSTOMER_SUPPORT_EMAIL"),
                    customerSupportPhone: getContactValue("CUSTOMER_SUPPORT_CONTACT_NUMBER"),
                    customerSupportLink: getContactValue("CUSTOMER_SUPPORT_LINK"),
                    groName: getContactValue("GRO_NAME"),
                    groEmail: getContactValue("GRO_EMAIL"),
                    groPhone: getContactValue("GRO_CONTACT_NUMBER"),
                    groDesignation: getContactValue("GRO_DESIGNATION"),
                    groAddress: getContactValue("GRO_ADDRESS"),
                    
                    // Transaction details
                    transactionId: onselectRequest.context.transaction_id,
                    timestamp: onselectRequest.context.timestamp,
                    quoteValidityPeriod: quote?.ttl || null,
                    
                    // Reference to original data
                    originalRequest: record.onselectRequest
                };
            });

            res.status(200).json(offers);

        } catch (error) {
            console.error('Error fetching offers:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = OffersController;