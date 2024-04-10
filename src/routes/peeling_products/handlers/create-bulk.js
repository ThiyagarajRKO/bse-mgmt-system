import { PeelingProducts } from "../../../controllers";

export const BulkCreate = (
  { profile_id, peeling_product_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // await Promise.all(
      peeling_product_data?.map((item) => {
        item.peeling_status = "In Progress";

        item.is_active = true;

        item.created_by = profile_id;
      });
      // );

      const peeling_product = await PeelingProducts.BulkInsert(
        profile_id,
        peeling_product_data
      );

      resolve({
        message: "Peeling product data has been inserted successfully",
        data: peeling_product,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
