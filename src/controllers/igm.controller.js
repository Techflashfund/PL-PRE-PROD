class StatusController {
    static async checkigmStatus(req, res) {
        try {
            const { userId } = req.body;
    
            // Fetch all transactions for the user
            const transactions = await Transaction.find({ user: userId });
    
            if (!transactions.length) {
                return res.status(404).json({
                    message: "No transactions found for this user",
                });
            }
    
            // Track transactions in both collections and those only in transactions
            const validTransactions = [];
            const rejectedTransactions = [];
    
            // Check which transactions exist in DisbursedLoans
            for (const transaction of transactions) {
                const loan = await DisbursedLoan.findOne({
                    transactionId: transaction.transactionId,
                });
    
                if (loan) {
                    // Transaction exists in both collections
                    validTransactions.push({
                        transaction,
                        loan
                    });
                } else {
                    // Transaction exists only in Transaction collection
                    rejectedTransactions.push(transaction);
                }
            }
    
            if (!validTransactions.length) {
                return res.status(404).json({
                    message: "No disbursed loans found that match transactions",
                    rejectedTransactions: rejectedTransactions.map(t => t.transactionId)
                });
            }
    
            // Send status requests only for valid transactions
            await Promise.all(
                validTransactions.map(async ({ transaction, loan }) => {
                    const { context } = loan.Response;
    
                    const statusPayload = {
                        context: {
                            ...context,
                            action: "status",
                            message_id: uuidv4(),
                            timestamp: new Date().toISOString(),
                        },
                        message: {
                            ref_id: transaction.transactionId,
                        },
                    };
    
                    await statusRequest(statusPayload);
                })
            );
    
            // Wait for 5 seconds
            await new Promise((resolve) => setTimeout(resolve, 5000));
    
            // Fetch updated loan details
            const updatedLoans = await Promise.all(
                validTransactions.map(async ({ transaction }) => {
                    const loan = await DisbursedLoan.findOne({
                        transactionId: transaction.transactionId,
                    });
    
                    if (!loan) return null;
    
                    return {
                        transactionId: transaction.transactionId,
                        providerId: loan.providerId,
                        providerDetails: loan.providerDetails,
                        loanDetails: loan.loanDetails,
                        breakdown: loan.breakdown,
                        customer: loan.customer,
                        paymentSchedule: loan.paymentSchedule,
                        documents: loan.documents,
                        status: loan.status
                    };
                })
            );
    
            const finalLoans = updatedLoans.filter((loan) => loan !== null);
    
            res.status(200).json({
                message: "Loan status check completed",
                totalLoans: finalLoans.length,
                loans: finalLoans,
            });
        } catch (error) {
            console.error("Loan status check failed:", error);
            res.status(500).json({ error: error.message });
        }
    }

}
