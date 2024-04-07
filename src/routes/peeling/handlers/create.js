import { Dispatches, Peeling } from "../../../controllers";

export const Create = (
  {
    profile_id,
    dispatch_id,
    unit_master_id,
    product_master_id,
    peeling_quantity,
    peeling_method,
    peeling_notes,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { dispatch_quantity } = await Dispatches.GetQuantity({
        id: dispatch_id,
      });

      if (!dispatch_quantity) {
        return reject({
          statusCode: 420,
          message: "Invalid peeling quantity",
        });
      } else if (dispatch_quantity < peeling_quantity) {
        return reject({
          statusCode: 420,
          message: "Peeling quantity is grater than Procurement quantity",
        });
      }

      const peeling = await Peeling.Insert(profile_id, {
        dispatch_id,
        unit_master_id,
        product_master_id,
        peeling_quantity,
        peeling_method,
        peeling_status: "In Progress",
        peeling_notes,
        is_active: true,
      });

      resolve({
        message: "Peeling data has been inserted successfully",
        data: {
          peeling_id: peeling?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
