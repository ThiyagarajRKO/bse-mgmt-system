import { ShippingMaster } from "../../../controllers";

export const Update = (
  { profile_id, shipping_master_id, shipping_master_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updated_data = await ShippingMaster.Update(
        profile_id,
        shipping_master_id,
        shipping_master_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Shipping master has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Shipping master didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
