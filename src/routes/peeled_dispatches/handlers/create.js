import { PeeledDispatches, PeelingProducts } from "../../../controllers";

export const Create = async (
  {
    profile_id,
    peeled_dispatch_id,
    peeled_product_id,
    unit_master_id,
    peeled_dispatch_quantity,
    temperature,
    delivery_notes,
    vehicle_master_id,
    driver_master_id,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { peeled_quantity } = await PeelingProducts.GetQuantity({
        id: peeled_product_id,
      });

      if (!peeled_quantity) {
        return reject({
          statusCode: 420,
          message: "Invalid product quantity",
        });
      } else if (peeled_quantity < peeled_dispatch_quantity) {
        return reject({
          statusCode: 420,
          message: "Dispatched quantity is greater than Procurement quantity",
        });
      }
      const dispatch = await PeeledDispatches.Insert(profile_id, {
        peeled_dispatch_id,
        peeled_product_id,
        unit_master_id,
        peeled_dispatch_quantity,
        temperature,
        delivery_notes,
        delivery_status: "In Transit",
        vehicle_master_id,
        driver_master_id,
        is_active: true,
      });

      return {
        success: true,
        message: "Dispatch data has been inserted successfully",
        data: {
          peeled_dispatch_id: dispatch.id,
        },
      };
    } catch (err) {
      fastify.log.error(err);
      throw err;
    }
  });
};
