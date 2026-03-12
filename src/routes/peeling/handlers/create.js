import { Dispatches, Peeling } from "../../../controllers";
import { ApplyJournalTemplateInternal } from "../../../controllers/accounting/template";

export const Create = (
  {
    profile_id,
    dispatch_id,
    unit_master_id,
    peeling_quantity,
    peeling_method,
    PeelingProducts,
    order_id,
  },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("=== Peeling Create Handler ===");
      console.log(
        "PeelingProducts received:",
        JSON.stringify(PeelingProducts, null, 2),
      );
      console.log("Is array?", Array.isArray(PeelingProducts));
      console.log("Length?", PeelingProducts?.length);

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
        },
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
          order_id,
          is_active: true,
        },
        Array.isArray(PeelingProducts) && PeelingProducts.length > 0
          ? true
          : false,
      );

      await Dispatches.Update(profile_id, dispatch_id, {
        delivery_status: "Delivered",
      });

      // Trigger automatic journal entry for PRODUCTION_COMPLETION (peeling/processing)
      try {
        // Calculate total output cost (peeling_quantity is in KG)
        // For now, we use quantity as a proxy; ideally fetch cost from dispatch/order
        const outputAmount = parseFloat(peeling_quantity) * 100; // Assume 100 per KG for now
        await ApplyJournalTemplateInternal({
          event_type: "PRODUCTION_COMPLETION",
          reference_type: "PEELING",
          reference_id: peeling?.id,
          amount: outputAmount,
          description: `Production completion (peeling) - ${peeling_quantity}kg from dispatch ${dispatch_id}`,
          created_by: profile_id,
        });
      } catch (journalError) {
        console.warn(
          "Journal entry creation failed for PRODUCTION_COMPLETION (non-blocking):",
          journalError.message,
        );
        // Don't fail the peeling creation if journal entry fails
      }

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
