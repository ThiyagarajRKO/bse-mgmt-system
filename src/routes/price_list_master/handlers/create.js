import { PriceListMaster } from "../../../controllers";
import * as PriceUpdate from "../handlers/update";

export const Create = (
  { profile_id, price_list_name, currency, PriceListProductMasters },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const price_list_master_id = await PriceListMaster.CheckName({
        price_list_name,
      });

      if (price_list_master_id) {
        await Promise.all(
          PriceListProductMasters.map((product) => {
            product.price_list_master_id = price_list_master_id?.id;
          })
        );

        await PriceUpdate.Update({
          profile_id,
          price_list_master_id: price_list_master_id?.id,
          price_list_master_data: {
            currency,
            PriceListProductMasters,
          },
        }).catch(console.log);

        return resolve({
          message: "Price list master data has been inserted successfully",
          data: {
            price_list_master_id: price_list_master_id?.id,
          },
        });
      }

      const price_list_master = await PriceListMaster.Insert(
        profile_id,
        {
          price_list_name,
          currency,
          PriceListProductMasters,
          is_active: true,
        },
        Array.isArray(PriceListProductMasters) &&
          PriceListProductMasters.length > 0
          ? true
          : false
      );

      resolve({
        message: "Price list master data has been inserted successfully",
        data: {
          price_list_master_id: price_list_master?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
