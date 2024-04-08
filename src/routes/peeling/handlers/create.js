import { Dispatches, Peeling } from "../../../controllers";

export const Create = (
  {
    profile_id,
    dispatch_id,
    unit_master_id,
    product_master_id = null,
    peeling_quantity,
    yield_quantity,
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
      }

      const { old_peeling_quantity } = await Peeling.GetSumQuantityByDispatchId(
        {
          dispatch_id,
        }
      );

      const total_peeling_quantity =
        (parseFloat(old_peeling_quantity) || 0) + parseFloat(peeling_quantity);

      if (dispatch_quantity < total_peeling_quantity) {
        return reject({
          statusCode: 420,
          message: "Peeling quantity is grater than Dipatched quantity",
        });
      }

      const peeling = await Peeling.Insert(profile_id, {
        dispatch_id,
        unit_master_id,
        product_master_id: product_master_id || null,
        peeling_quantity,
        yield_quantity,
        peeling_method,
        peeling_status:
          product_master_id && yield_quantity ? "Completed" : "In Progress",
        peeling_notes,
        is_active: true,
      });

      await Dispatches.Update(profile_id, dispatch_id, {
        delivery_status: "Delivered",
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
