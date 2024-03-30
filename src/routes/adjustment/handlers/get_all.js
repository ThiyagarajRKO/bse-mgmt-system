import { Adjustment } from "../../../controllers";

export const GetAll = (
  {
    procurement_lot,
    procurement_product,
    procurement_quantity,
    procurement_price,
    adjustment_adjusted_quantity,
    adjustment_adjusted_price,
    adjustment_reason,
    adjustment_surveyor,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let adjustment = await Adjustment.GetAll({
        procurement_lot,
        procurement_product,
        procurement_quantity,
        procurement_price,
        adjustment_adjusted_quantity,
        adjustment_adjusted_price,
        adjustment_reason,
        adjustment_surveyor,
      });

      if (!adjustment) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
        });
      }

      resolve({
        data: adjustment,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
