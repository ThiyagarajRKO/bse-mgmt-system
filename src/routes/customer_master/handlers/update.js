import { CustomerMaster } from "../../../controllers";

export const Update = (
  { profile_id, customer_master_id, customer_master_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updated_data = await CustomerMaster.Update(
        profile_id,
        customer_master_id,
        customer_master_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Customer master has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Customer master didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
