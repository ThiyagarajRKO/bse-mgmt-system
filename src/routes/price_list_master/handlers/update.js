import { PriceListMaster } from "../../../controllers";

export const Update = (
  { profile_id, price_list_master_id, price_list_master_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updated_data = await PriceListMaster.Update(
        profile_id,
        price_list_master_id,
        price_list_master_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Price list master has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Price List master didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
