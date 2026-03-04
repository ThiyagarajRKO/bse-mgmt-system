import { CustomerMaster } from "../../../controllers";

export const Delete = (
  { profile_id, customer_master_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const customer_master = await CustomerMaster.Delete({
        profile_id,
        id: customer_master_id,
      });

      if (customer_master > 0) {
        return resolve({
          message: "Customer master has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Customer master didn't delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
