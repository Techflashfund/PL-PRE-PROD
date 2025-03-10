const express = require('express');
const router = express.Router();
const Transaction = require('../models/transaction.model');
const UserDetails = require('../models/userdetails.model');

/**
 * Status Mapping for Application Flow
 * Maps internal status codes to user-friendly status information
 */
const statusMapping = {
  // Selection Phase
  "SELECTONE_INITIATED": {
    status: "Pending",
    subStatus: "Need to complete application",
    progressScore: 10
  },
  "SELECTONE_COMPLETED": {
    status: "Pending",
    subStatus: "Need to complete application",
    progressScore: 25
  },
  
  // Selection Phase Two
  "SELECTWO_INITIATED": {
    status: "Pending",
    subStatus: "Consent needed",
    progressScore: 35
  },
  "SELECTWO_COMPLETED": {
    status: "Pending",
    subStatus: "Consent needed",
    progressScore: 35
  },
  
  // Selection Phase Three
  "SELECTHREE_INITIATED": {
    status: "Pending",
    subStatus: "KYC needs to be completed",
    progressScore: 45
  },
  "SELECTHREE_COMPLETED": {
    status: "Pending",
    subStatus: "KYC needs to be completed",
    progressScore: 45
  },
  
  // Initialization Phase One
  "INITONE_INITIATED": {
    status: "Complete",
    subStatus: "Adding bank account",
    progressScore: 60
  },
  "INITONE_COMPLETED": {
    status: "Complete",
    subStatus: "Adding bank account",
    progressScore: 60
  },
  
  // Initialization Phase Two
  "INITTWO_INITIATED": {
    status: "Complete",
    subStatus: "E-mandate",
    progressScore: 70
  },
  "INITWO_COMPLETED": {
    status: "Complete",
    subStatus: "E-mandate",
    progressScore: 70
  },
  
  // Initialization Phase Three
  "INITTHREE_INITIATED": {
    status: "Complete",
    subStatus: "Sign agreement",
    progressScore: 80
  },
  "INITHREE_COMPLETED": {
    status: "Complete",
    subStatus: "Sign agreement",
    progressScore: 80
  },
  
  // Confirmation Phase
  "CONFIRM_INITIATED": {
    status: "Complete",
    subStatus: "Give consent",
    progressScore: 90
  },
  "CONFIRM_COMPLETED": {
    status: "Complete",
    subStatus: "Give consent",
    progressScore: 90
  },
  
  // Final Phases
  "LOAN_SANCTIONED": {
    status: "Approved",
    subStatus: null,
    progressScore: 95
  },
  "LOAN_DISBURSED": {
    status: "Approved",
    subStatus: null,
    progressScore: 100
  }
};

/**
 * Helper function to translate raw status to user-friendly status info
 */
function getStatusInfo(rawStatus) {
  if (statusMapping[rawStatus]) {
    return statusMapping[rawStatus];
  }
  return {
    status: "Unknown",
    subStatus: null,
    progressScore: 0
  };
}

/**
 * GET /api/transactions/history
 * Retrieves transaction history for the specified period
 */
router.get('/transactions/history', async (req, res) => {
  try {
    // Get the months parameter from query, default to 1 (30 days)
    const months = parseInt(req.query.months) || 1;
    
    // Calculate the date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    // Find transactions within the date range, sorted by newest first
    const transactions = await Transaction.find({
      createdAt: { $gte: startDate, $lte: endDate }
    })
    .sort({ createdAt: -1 })
    .lean()
    .populate({
      path: 'user',
      select: 'email'
    });
    
    // Get user details and map status codes to user-friendly format
    const transactionData = await Promise.all(transactions.map(async (transaction) => {
      const userDetail = await UserDetails.findOne({ user: transaction.user._id }).lean();
      
      // Calculate age if dob exists
      let age = null;
      if (userDetail && userDetail.dob) {
        const dobDate = new Date(userDetail.dob);
        const ageDiffMs = Date.now() - dobDate.getTime();
        const ageDate = new Date(ageDiffMs);
        age = Math.abs(ageDate.getUTCFullYear() - 1970);
      }
      
      // Get user-friendly status information
      const statusInfo = getStatusInfo(transaction.status);
      
      return {
        name: transaction.user.email,
        transactionId: transaction.transactionId,
        amount: transaction.amount || "N/A",
        rawStatus: transaction.status || "N/A",
        status: statusInfo.status,
        subStatus: statusInfo.subStatus,
        progressScore: statusInfo.progressScore,
        date: transaction.createdAt,
        loanPurpose: userDetail ? userDetail.endUse : "N/A",
        age: age || "N/A"
      };
    }));
    
    return res.status(200).json({
      success: true,
      data: {
        transactions: transactionData,
        period: {
          startDate,
          endDate,
          months
        }
      }
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction history',
      error: error.message
    });
  }
});

/**
 * GET /api/dashboard
 * Dashboard data with transaction summary for the specified period
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Get the months parameter from query, default to 2 months for dashboard
    const months = parseInt(req.query.months) || 2;
    
    // Calculate the date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    // Find transactions within the date range
    const rawTransactions = await Transaction.find({
      createdAt: { $gte: startDate, $lte: endDate }
    })
    .sort({ createdAt: -1 })
    .lean()
    .populate({
      path: 'user',
      select: 'email'
    });
    
    // Process transactions to include status mapping and required fields
    const transactions = await Promise.all(rawTransactions.map(async (transaction) => {
      const userDetail = await UserDetails.findOne({ user: transaction.user._id }).lean();
      
      // Calculate age if dob exists
      let age = null;
      if (userDetail && userDetail.dob) {
        const dobDate = new Date(userDetail.dob);
        const ageDiffMs = Date.now() - dobDate.getTime();
        const ageDate = new Date(ageDiffMs);
        age = Math.abs(ageDate.getUTCFullYear() - 1970);
      }
      
      // Get user-friendly status information
      const statusInfo = getStatusInfo(transaction.status);
      
      return {
        name: transaction.user.email,
        transactionId: transaction.transactionId,
        amount: transaction.amount || "N/A",
        rawStatus: transaction.status || "N/A",
        status: statusInfo.status,
        subStatus: statusInfo.subStatus,
        progressScore: statusInfo.progressScore,
        date: transaction.createdAt,
        loanPurpose: userDetail ? userDetail.endUse : "N/A",
        age: age || "N/A"
      };
    }));
    
    // Get transaction stats
    const totalTransactions = transactions.length;
    
    // Group transactions by user-friendly status
    const transactionsByStatus = transactions.reduce((acc, transaction) => {
      const status = transaction.status || 'unknown';
      if (!acc[status]) acc[status] = 0;
      acc[status]++;
      return acc;
    }, {});
    
    // Group transactions by progress score ranges
    const progressRanges = {
      'Initial (0-25%)': 0,
      'Early (26-50%)': 0,
      'Mid (51-75%)': 0,
      'Late (76-95%)': 0,
      'Complete (96-100%)': 0
    };
    
    transactions.forEach(transaction => {
      const score = transaction.progressScore;
      if (score <= 25) progressRanges['Initial (0-25%)']++;
      else if (score <= 50) progressRanges['Early (26-50%)']++;
      else if (score <= 75) progressRanges['Mid (51-75%)']++;
      else if (score <= 95) progressRanges['Late (76-95%)']++;
      else progressRanges['Complete (96-100%)']++;
    });
    
    // Get transactions by day for the chart data
    const transactionsByDay = {};
    transactions.forEach(transaction => {
      const date = new Date(transaction.date).toISOString().split('T')[0]; // YYYY-MM-DD
      if (!transactionsByDay[date]) transactionsByDay[date] = 0;
      transactionsByDay[date]++;
    });
    
    return res.status(200).json({
      success: true,
      data: {
        transactionStats: {
          total: totalTransactions,
          byStatus: transactionsByStatus,
          byProgressRange: progressRanges
        },
        transactionsByDay,
        recentTransactions: transactions.slice(0, 10), // Latest 10 transactions
        period: {
          startDate,
          endDate,
          months
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

module.exports = router;