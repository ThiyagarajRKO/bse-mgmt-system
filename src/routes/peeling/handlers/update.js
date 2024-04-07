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
            message: "Invalid dispatch quantity",
          });
        } else if (dispatch_quantity < peeling_data?.peeling_quantity) {
          return reject({
            statusCode: 420,
            message: "Peeling quantity is grater than Procurement quantity",
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
