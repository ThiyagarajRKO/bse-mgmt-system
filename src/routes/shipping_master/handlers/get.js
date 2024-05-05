import { ShippingMaster } from "../../../controllers";

export const Get = ({ shipping_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let shipping_master = await ShippingMaster.Get({
        id: shipping_master_id,
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
