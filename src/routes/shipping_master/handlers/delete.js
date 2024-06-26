import { ShippingMaster } from "../../../controllers";

export const Delete = (
  { profile_id, shipping_master_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const shipping_master = await ShippingMaster.Delete({
        profile_id,
        id: shipping_master_id,
      });

      if (shipping_master > 0) {
        return resolve({
          message: "Shipping master has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Shipping master didn't delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
