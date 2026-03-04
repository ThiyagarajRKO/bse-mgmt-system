import { SupplierMaster } from "../../../controllers";

export const Delete = (
  { profile_id, supplier_master_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const supplier_master = await SupplierMaster.Delete({
        profile_id,
        id: supplier_master_id,
      });

      if (supplier_master > 0) {
        return resolve({
          message: "Supplier master has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Supplier master didn't delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
