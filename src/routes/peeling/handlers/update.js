import { Dispatches, Peeling } from "../../../controllers";

export const Update = (
  { profile_id, peeling_id, peeling_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (peeling_data?.peeling_quantity) {
        if (!peeling_data?.dispatch_id) {
          return reject({
            statusCode: 420,
            message: "dispatch id must not be empty",
          });
        }
        const { dispatch_quantity } = await Dispatches.GetQuantity({
          id: peeling_data?.dispatch_id,
        });

        if (!dispatch_quantity) {
          return reject({
            statusCode: 420,
            message: "Invalid peeling quantity",
          });
        }

        const { old_peeling_quantity } =
          await Peeling.GetSumQuantityByDispatchId({
            id: peeling_id,
            dispatch_id: peeling_data?.dispatch_id,
          });

        const total_peeling_quantity =
          (parseFloat(old_peeling_quantity) || 0) +
          parseFloat(peeling_data?.peeling_quantity);

        if (dispatch_quantity < total_peeling_quantity) {
          return reject({
            statusCode: 420,
            message: "Peeling quantity is grater than Dipatched quantity",
          });
        }
      }

      const updated_data = await Peeling.Update(
        profile_id,
        peeling_id,
        peeling_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Peeling data has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Peeling data didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
