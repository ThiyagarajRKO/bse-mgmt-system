import { PeeledDispatches, Packing } from "../../../controllers";

export const Create = async (
  {
    profile_id,
    peeled_dispatch_id,
    unit_master_id,
    packing_quantity,
    grade_master_id,
    size_master_id,
    packaging_master_id,
    packing_notes,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { peeled_dispatch_quantity } = await PeeledDispatches.GetQuantity({
        id: peeled_dispatch_id,
      });

      if (!peeled_dispatch_quantity) {
        return reject({
          statusCode: 420,
          message: "Invalid product quantity",
        });
      } else if (peeled_dispatch_quantity < packing_quantity) {
        return reject({
          statusCode: 420,
          message: "Packing quantity is greater than Dispatched quantity",
        });
      }
      const packing = await Packing.Insert(profile_id, {
        peeled_dispatch_id,
        unit_master_id,
        packing_quantity,
        grade_master_id,
        size_master_id,
        packaging_master_id,
        packing_notes,
        is_active: true,
      });

      resolve({
        message: "Packing data has been inserted successfully",
        data: {
          packing_id: packing.id,
        },
      });
    } catch (err) {
      reject(err);
    }
  });
};
