import {
  PeeledDispatches,
  PeelingProducts,
  Peeling,
} from "../../../controllers";

export const Create = async (
  {
    profile_id,
    peeled_product_id,
    unit_master_id,
    peeled_dispatch_quantity,
    temperature,
    delivery_notes,
    vehicle_master_id,
    driver_master_id,
    order_id,
  },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { yield_quantity } = await PeelingProducts.GetQuantity({
        id: peeled_product_id,
      });

      if (!yield_quantity) {
        return reject({
          statusCode: 420,
          message: "Invalid product quantity",
        });
      } else if (yield_quantity < peeled_dispatch_quantity) {
        return reject({
          statusCode: 420,
          message: "Dispatched quantity is greater than Procurement quantity",
        });
      }

      // Get peeling product to retrieve order_id and peeling_id
      let final_order_id = order_id;
      let peeling_id = null;

      const peelingProduct = await PeelingProducts.Get({
        id: peeled_product_id,
      });

      if (peelingProduct?.peeling_id) {
        peeling_id = peelingProduct.peeling_id;

        if (!final_order_id) {
          const peeling = await Peeling.Get({ id: peeling_id });
          final_order_id = peeling?.order_id;
        }
      }

      // Create the peeled dispatch
      const dispatch = await PeeledDispatches.Insert(profile_id, {
        peeled_product_id,
        unit_master_id,
        peeled_dispatch_quantity,
        temperature,
        delivery_notes,
        vehicle_master_id,
        driver_master_id,
        order_id: final_order_id,
        is_active: true,
      });

      // Link QA record to the peeled dispatch if a QA record exists for this peeling
      if (peeling_id && fastify?.models?.QAChecklist) {
        try {
          const qaRecord = await fastify.models.QAChecklist.findOne({
            where: { peeling_id, is_active: true },
            order: [["created_at", "DESC"]],
            raw: true,
          });

          if (qaRecord) {
            // Update the peeled dispatch with the QA record link
            await dispatch.update({
              qa_checklist_id: qaRecord.id,
            });
          }
        } catch (qaErr) {
          fastify.log.warn(
            `[Peeled Dispatch] Could not link QA record: ${qaErr.message}`,
          );
          // Continue - QA link is optional
        }
      }

      resolve({
        message: "Dispatch data has been inserted successfully",
        data: {
          peeled_dispatch_id: dispatch.id,
        },
      });
    } catch (err) {
      reject(err);
    }
  });
};
