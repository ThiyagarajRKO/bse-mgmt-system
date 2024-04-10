import { Dispatches, Peeling } from "../../../controllers";

export const Create = (
  {
    profile_id,
    dispatch_id,
    unit_master_id,
    peeling_quantity,
    peeling_method,
    PeelingProducts,
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

      const peeling = await Peeling.Insert(
        profile_id,
        {
          dispatch_id,
          unit_master_id,
          peeling_quantity,
          peeling_method,
          PeelingProducts,
          is_active: true,
        },
        Array.isArray(PeelingProducts) && PeelingProducts.length > 0
          ? true
          : false
      );

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
