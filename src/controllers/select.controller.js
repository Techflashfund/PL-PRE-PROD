const Transaction = require("../models/transaction.model");
const SelectRequestHandler = require("../services/select.services");
const SelectOne = require("../models/selectone.nodel");
const SelectHelper = require("../helper/select.helper");
const TempData = require("../models/tempdata");

class SelectController {
  static async makeSelect(req, res) {
    try {
      const { transactionId, submissionId } = req.body;

      const transaction = await Transaction.findOne({ transactionId }).populate(
        "formDetails"
      );

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      const selectPayload = SelectRequestHandler.createSelectPayload(
        transaction.ondcResponse,
        submissionId
      );

      const selectResponse = await SelectRequestHandler.makeSelectRequest(
        selectPayload
      );

      await Transaction.findByIdAndUpdate(transaction._id, {
        status: "SELECT_INITIATED",
        selectPayload,
        selectRequestTimestamp: new Date(),
      });

      res.status(200).json({
        message: "Select request initiated successfully",
        selectResponse,
      });
    } catch (error) {
      console.error("Select request failed:", error);
      res.status(500).json({ error: error.message });
    }
  }

  static async onSelect(req, res) {
    try {
        const tempData = new TempData({
            responseData: req.body
        });
      const { context, message } = req.body;
      

      if (!context?.transaction_id || !message) {
        return res
          .status(400)
          .json({ error: "Invalid select response format" });
      }
      const payloadType = SelectHelper.getPayloadType(req.body);

      if (!payloadType) {
        console.log("no payload ");

        return res.status(400).json({
          error: "Invalid payload structure or unknown payload type",
        });
      }
      let result;
      switch (payloadType) {
        case "INITIAL_FORM":
          result = await SelectHelper.handleOnselectInitialForm(req.body);
          break;

        case "LOAN_AMOUNT":
          result = await SelectHelper.handleOnselectLoanAmount(req.body);
          break;

        case "KYC":
          result = await SelectHelper.handleOnselectKYC(req.body);
          break;

        default:
          throw new Error("Unknown payload type");
      }

      // Update SelectOne
      const selectOne = await SelectOne.findOneAndUpdate(
        {
          transactionId: context.transaction_id,
          providerId: message.order.provider.id,
        },
        {
          $set: {
            onselectRequest: req.body,
            status: "COMPLETED",
            responseTimestamp: new Date(),
          },
        },
        { new: true }
      );

      if (!selectOne) {
        return res.status(404).json({ error: "Select request not found" });
      }

      // Update Transaction
      await Transaction.findOneAndUpdate(
        { transactionId: context.transaction_id },
        {
          status: "SELECTONE_COMPLETED",
          selectoneResponse: req.body,
        }
      );

      res.status(200).json({
        message: "Select response processed successfully",
        transactionId: context.transaction_id,
        providerId: message.order.provider.id,
      });
    } catch (error) {
      console.error("Select response processing failed:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = SelectController;
