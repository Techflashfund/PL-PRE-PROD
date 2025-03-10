const express = require('express');
const router = express.Router();
const Transaction = require('../models/transaction.model');
const UserDetails = require('../models/userdetails.model'); // Added for loan purpose and age calculation

/**
 * GET /api/transactions/history
 * Retrieves transaction history for the specified period
 * Query parameters:
 *  - months: Number of months of history to retrieve (default: 1)
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
    
    // Get user details to access loan purpose (endUse) and age (calculated from dob)
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
      
      return {
        name: transaction.user.email,
        transactionId: transaction.transactionId,
        amount: transaction.amount || "N/A",
        status: transaction.status || "N/A",
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
 * Query parameters:
 *  - months: Number of months of history to retrieve (default: 2)
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
    
    // Process transactions to include only the required fields
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
      
      return {
        name: transaction.user.email,
        transactionId: transaction.transactionId,
        amount: transaction.amount || "N/A",
        status: transaction.status || "N/A",
        date: transaction.createdAt,
        loanPurpose: userDetail ? userDetail.endUse : "N/A",
        age: age || "N/A"
      };
    }));
    
    // Get transaction stats
    const totalTransactions = transactions.length;
    
    // Group transactions by status
    const transactionsByStatus = transactions.reduce((acc, transaction) => {
      const status = transaction.status || 'unknown';
      if (!acc[status]) acc[status] = 0;
      acc[status]++;
      return acc;
    }, {});
    
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
          byStatus: transactionsByStatus
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