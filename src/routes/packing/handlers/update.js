import { PeeledDispatches, Packing } from "../../../controllers";

export const Update = (
  { profile_id, packing_id, packing_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!packing_data?.packing_quantity) {
        if (!packing_data?.peeled_dispatch_id) {
          return reject({
            statusCode: 420,
            message: "Packed product id must not be empty",
          });
        }
        const { peeled_dispatch_quantity } = await PeeledDispatches.GetQuantity(
          {
            id: packing_data?.peeled_dispatch_id,
          }
        );

        if (!peeled_dispatch_quantity) {
          return reject({
            statusCode: 420,
            message: "Invalid product quantity",
          });
        } else if (peeled_dispatch_quantity < packing_data?.packing_quantity) {
          return reject({
            statusCode: 420,
            message: "Packed quantity is greater than Dispatched quantity",
          });
        }
      }

      const updated_data = await Packing.Update(
        profile_id,
        packing_id,
        packing_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Packing data has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Packing data didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
