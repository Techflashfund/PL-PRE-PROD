const InitHelper = require("../helper/init.helper");
const InitOne = require("../models/initone.model");
const Transaction = require("../models/transaction.model");
const {getInitPayloadType} =require('../handler/initpayloadfounder')

class InitController {
  static async onInit(req, res) {
    try {
      const requestType = await getInitPayloadType(req.body);
            if (!requestType) {
                throw new Error("Unknown request type");
            }

      const { context, message } = req.body;


      switch (requestType) {
        case "TypeOne":
          await InitHelper.handleTypeOne(req.body);
          break;
        case "TypeTwo":
          await InitHelper.handleTypeTwo(req.body);
          break;
        case "TypeThree":
          await InitHelper.handleTypeThree(req.body);
          break;
        default:
          throw new Error("Unknown request type");
      }
      // Update InitOne
      // await InitOne.findOneAndUpdate(
      //   {
      //     transactionId: context.transaction_id,
      //     providerId: message.order.provider.id,
      //   },
      //   {
      //     $set: {
      //       status: "COMPLETED",
      //       responseTimestamp: new Date(),
      //       initonerequest: req.body,
      //     },
      //   }
      // );

      // // Update Transaction
      // await Transaction.findOneAndUpdate(
      //   { transactionId: context.transaction_id },
      //   { status: "INITONE_COMPLETED" }
      // );

      res.status(200).json({
        message: "Init response processed successfully",
      });
    } catch (error) {
      console.error("Init response processing failed:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = InitController;
