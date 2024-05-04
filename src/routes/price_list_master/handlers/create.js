import { PriceListMaster } from "../../../controllers";

export const Create = (
  { profile_id, price_list_name, currency, PriceListProductMaster },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const carrier_master = await PriceListMaster.Insert(
        profile_id,
        {
          price_list_name,
          currency,
          PriceListProductMaster,
          is_active: true,
        },
        Array.isArray(PriceListProductMaster) &&
          PriceListProductMaster.length > 0
          ? true
          : false
      );

      resolve({
        message: "Price list master data has been inserted successfully",
        data: {
          price_list_master_id: carrier_master?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
