import { PeelingProducts } from "../../../controllers";

export const Create = (
  { profile_id, peeling_id, product_master_id, yield_quantity, peeling_notes },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const peeling_product = await PeelingProducts.Insert(profile_id, {
        peeling_id,
        product_master_id,
        yield_quantity,
        peeling_notes,
        is_active: true,
      });

      resolve({
        message: "Peeling product data has been inserted successfully",
        data: {
          peeled_product_id: peeling_product?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
