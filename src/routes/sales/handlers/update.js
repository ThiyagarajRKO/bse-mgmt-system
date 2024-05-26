import { Sales } from "../../../controllers";

export const Update = (
  { profile_id, sales_id, sales_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updated_data = await Sales.Update(profile_id, sales_id, sales_data);

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Order has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Order didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
