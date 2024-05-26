import { Sales } from "../../../controllers";

export const Delete = ({ profile_id, sales_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const shipping_master = await Sales.Delete({
        profile_id,
        id: sales_id,
      });

      if (shipping_master > 0) {
        return resolve({
          message: "Order has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Shipping master didn't delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
