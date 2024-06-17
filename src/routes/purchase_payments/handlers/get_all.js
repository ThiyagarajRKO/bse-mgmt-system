import { PurchasePayment} from "../../../controllers";

export const GetAll = (
  {
    start,
    length,
    id,
    supplier_master_id,
    procurement_lots,
    "search[value]": search,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let purchase_payment = await PurchasePayment.GetAll({
        start,
        length,
        supplier_master_id,
        procurement_lots,
        search,
      });

      if (!purchase_payment) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: purchase_payment,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
