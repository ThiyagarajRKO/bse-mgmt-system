import { ShippingMaster } from "../../../controllers";

export const Create = (
  {
    profile_id,
    carrier_master_id,
    shipping_source,
    shipping_destination,
    shipping_price,
    shipping_notes,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const shipping_master = await ShippingMaster.Insert(profile_id, {
        carrier_master_id,
        shipping_source,
        shipping_destination,
        shipping_price,
        shipping_notes,
        is_active: true,
      });

      resolve({
        message: "Shipping master data has been inserted successfully",
        data: {
          shipping_master_id: shipping_master?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
