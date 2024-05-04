import { PriceListMaster } from "../../../controllers";

export const Create = (
  { profile_id, price_list_name, currency, price_value, product_master_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const carrier_master = await PriceListMaster.Insert(profile_id, {
        price_list_name,
        currency,
        price_value,
        product_master_id,
        is_active: true,
      });

      resolve({
        message: "Price list master data has been inserted successfully",
        data: {
          carrier_master_id: carrier_master?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
