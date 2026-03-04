import { PeelingProducts } from "../../../controllers";

export const Delete = ({ profile_id, peeled_product_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const peeling_product = await PeelingProducts.Delete({
        profile_id,
        id: peeled_product_id,
      });

      if (peeling_product > 0) {
        return resolve({
          message: "Peeling product data has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Peeling product data didn't delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
