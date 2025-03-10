const mongoose = require("mongoose");
const SelectTwo = mongoose.model("SelectTwo");
const SelectedLoan = require("../models/selectedLoan.model");
const SelectPayloadHandler = require("../utils/select.request.utils");
const SelectThree = require("../models/selectThree.model");
const FormSubmissionServicetwo = require("../services/formsubmissiontwo.services");
const Transaction = require("../models/transaction.model");
const { selectRequest } = require("../services/select.services");
const SelectIds = require("../models/selectids.model");

class AmountController {
  static async submitAmount(req, res) {
    try {
      console.log("Amount submission request:", req.body);
      const { amount, providerId, transactionId, userId } = req.body;

      // Validate required fields
      if (!amount || !providerId || !transactionId || !userId) {
        return res.status(400).json({
          error:
            "Missing required fields: amount, bppId, transactionId, userId",
        });
      }

      // Validate amount is a positive number
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({
          error: "Amount must be a positive number",
        });
      }


      const updatedTransaction = await Transaction.findOneAndUpdate(
        { transactionId: transactionId },
        { amount: amount },
        { new: true } // This returns the updated document
      );
      
      if (!updatedTransaction) {
        return res.status(404).json({
          error: "Transaction not found"
        });
      }
      const selectTwo = await SelectTwo.findOne({
        transactionId,
        providerId,
      });

      if (!selectTwo) {
        return res.status(404).json({ error: "Select response not found" });
      }

      const formUrl = selectTwo.amountformurl;
      const formId = selectTwo.formId;

      if (!formUrl || !formId) {
        return res.status(404).json({ error: "Form details not found" });
      }

      const formResponse = await FormSubmissionServicetwo.submitAmountForm(
        formUrl,
        {
          amount,
          formId,
          userId,
          transactionId,
        }
      );
      const submissionId = formResponse.submission_id;
      const selectedLoan = await SelectedLoan.create({
        transactionId,
        requestedAmount: amount,
        sanctionedAmount: selectTwo.loanOffer.amount.value,
        lenderId: selectTwo.onselectRequest.message.order.provider.id,
        lenderName:
          selectTwo.onselectRequest.message.order.provider.descriptor.name,
        submissionId,
      });

      const selectPayload = await SelectPayloadHandler.createSelecthreePayload(
        selectTwo,
        submissionId
      );
      const selectResponse = await selectRequest(selectPayload);
      await SelectIds.create({
        transactionId: selectPayload.context.transaction_id,
        messageId: selectPayload.context.message_id,
        type: "SELECT_3",
      });

      await SelectThree.create({
        transactionId,
        providerId: selectTwo.onselectRequest.message.order.provider.id,
        selectPayload,
        selectResponse,
        status: "INITIATED",
        submissionId,
        requestedAmount: amount,
        responseTimestamp: new Date(),
      });

      // Update transaction status
      await Transaction.findOneAndUpdate(
        { transactionId },
        { status: "SELECTHREE_INITIATED" }
      );
      return res.status(200).json({
        message: "Amount submitted successfully",
        formResponse,
        selectedLoan,
      });
    } catch (error) {
      console.error("Amount submission failed:", error);
      return res.status(500).json({
        error: error.message,
        details: error.response?.data || "No additional details",
      });
    }
  }
}

module.exports = AmountController;
