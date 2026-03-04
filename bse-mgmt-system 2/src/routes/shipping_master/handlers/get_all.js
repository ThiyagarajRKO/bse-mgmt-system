import { ShippingMaster } from "../../../controllers";

export const GetAll = (
  { start, length, carrier_master_id, "search[value]": search },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Creating User
      let shipping_master = await ShippingMaster.GetAll({
        start,
        length,
        carrier_master_id,
        search,
      });

      if (!shipping_master) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: shipping_master,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
