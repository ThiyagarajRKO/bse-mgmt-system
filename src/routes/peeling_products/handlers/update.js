import { Dispatches, Peeling } from "../../../controllers";

export const Update = (
  { profile_id, peeling_product_id, peeling_product_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updated_data = await Peeling.Update(
        profile_id,
        peeling_product_id,
        peeling_product_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Peeling product data has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Peeling product data didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
