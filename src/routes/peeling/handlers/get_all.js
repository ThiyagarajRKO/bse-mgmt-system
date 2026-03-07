import { Peeling } from "../../../controllers";

export const GetAll = (
  {
    procurement_lot_id,
    order_id,
    order_no,
    peeling_id,
    start,
    length,
    "search[value]": search,
  },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // if user provided an order number rather than the UUID, look it up
      if (order_no && !order_id) {
        try {
          const orderRecord = await fastify.models.Orders.findOne({
            where: { order_no: order_no },
            attributes: ["id"],
          });
          if (orderRecord) {
            order_id = orderRecord.id;
          }
        } catch (err) {
          // swallowing the error here is acceptable; the API will simply
          // return no matching records if the translation fails
          fastify.log.warn(
            `[Peeling.GetAll] unable to resolve order_no ${order_no}: ${err.message}`,
          );
        }
      }
      let peeling = await Peeling.GetAll({
        procurement_lot_id,
        order_id,
        peeling_id,
        start,
        length,
        search,
      });

      if (!peeling) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: peeling,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
