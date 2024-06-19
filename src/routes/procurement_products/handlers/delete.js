import { ProcurementProducts } from "../../../controllers";

export const Delete = (
  {
    profile_id,
    procurement_product_id,
    procurement_lot_id,
    supplier_master_id,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const procurement = await ProcurementProducts.Delete({
        profile_id,
        id: procurement_product_id,
        procurement_lot_id,
        supplier_master_id,
      });

      if (procurement > 0) {
        return resolve({
          message: "Procurement product has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Procurement was not deleted",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
