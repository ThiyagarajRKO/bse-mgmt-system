import { PriceListMaster, PriceListProductMaster } from "../../../controllers";

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
        await PriceListProductMaster.BulkUpsert(
          profile_id,
          price_list_master_data?.PriceListProductMasters
        ).catch(console.log);

        return resolve({
          message: "Price list master has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Price List master didn't update",
      });
    } catch (err) {
      reject(err);
    }
  });
};
