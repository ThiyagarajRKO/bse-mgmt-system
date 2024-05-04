import { PriceListMaster } from "../../../controllers";

export const Delete = (
  { profile_id, price_list_master_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const carrier_master = await PriceListMaster.Delete({
        profile_id,
        id: price_list_master_id,
      });

      if (carrier_master > 0) {
        return resolve({
          message: "Price list master has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Price list master didn't delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
