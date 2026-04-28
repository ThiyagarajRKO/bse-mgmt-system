import { PeeledDispatches, Packing, Dispatches } from "../../../controllers";
import models from "../../../../models";
import { getQuantityQuery } from "../../../utils/queryBuilders";

export const Create = async (
  {
    profile_id,
    peeled_dispatch_id,
    dispatch_id, // ✅ NEW: For unprocessed products (Dispatch → Packing)
    unit_master_id,
    packing_quantity,
    grade_master_id, // Now optional
    size_master_id, // Now optional
    expiry_date,
    packaging_master_id,
    packing_notes,
  },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // ✅ Determine if this is unprocessed (dispatch) or processed (peeled_dispatch)
      const isUnprocessed = !!dispatch_id && !peeled_dispatch_id;

      if (isUnprocessed) {
        // ✅ UNPROCESSED PRODUCT PATH: Dispatch → Packing (skip Peeling & QA)
        console.log(
          "📦 Packing UNPROCESSED product directly from dispatch_id:",
          dispatch_id,
        );

        const dispatch = await models.Dispatches.findOne({
          where: { id: dispatch_id, is_active: true },
          include: [
            {
              model: models.ProcurementProducts,
              as: "pp",
              include: [
                {
                  model: models.ProductMaster,
                  as: "ProductMaster",
                  attributes: ["id", "grade_master_id", "size_master_id"],
                },
              ],
            },
          ],
        });

        if (!dispatch) {
          return reject({
            statusCode: 404,
            message: "Dispatch (unprocessed product) not found",
          });
        }

        // ✅ For UNPROCESSED products: Use UNSIZED size automatically
        // UNSIZED size_master_id: 20db7898-128e-4dbc-8185-5fbe3a49e5a8
        const UNSIZED_SIZE_ID = "20db7898-128e-4dbc-8185-5fbe3a49e5a8";

        // Derive grade and size from product if not provided
        const derivedGradeId =
          grade_master_id || dispatch.pp?.ProductMaster?.grade_master_id;
        const derivedSizeId =
          size_master_id ||
          dispatch.pp?.ProductMaster?.size_master_id ||
          UNSIZED_SIZE_ID;

        console.log(
          `📦 [UNPROCESSED] Packing with grade=${derivedGradeId}, size=${derivedSizeId}`,
        );

        // For unprocessed products, size is always available (UNSIZED as fallback)
        // Grade is optional

        // ✅ Validate dispatch quantity for unprocessed products
        const dispatchQuantity = dispatch.dispatch_quantity || 0;
        const alreadyPacked = dispatch.packed_quantity || 0;
        const availableQuantity = dispatchQuantity - alreadyPacked;

        if (availableQuantity <= 0) {
          return reject({
            statusCode: 420,
            message: "No quantity available for packing",
          });
        } else if (availableQuantity < packing_quantity) {
          return reject({
            statusCode: 420,
            message:
              "Packing quantity is greater than available dispatch quantity",
          });
        }

        // ✅ Create packing record for unprocessed product
        const packing = await Packing.Insert(profile_id, {
          peeled_dispatch_id: null, // No peeled dispatch for unprocessed
          dispatch_id: dispatch_id, // Link directly to dispatch
          order_id: dispatch.order_id,
          unit_master_id,
          packing_quantity,
          grade_master_id: derivedGradeId,
          size_master_id: derivedSizeId,
          packaging_master_id,
          expiry_date,
          packing_notes,
          is_active: true,
        });

        return resolve({
          message: "Unprocessed product packing created successfully",
          data: {
            packing_id: packing.id,
          },
        });
      }

      // ✅ PROCESSED PRODUCT PATH: Dispatch → Peeling → QA → Peeled Dispatch → Packing
      if (!peeled_dispatch_id) {
        return reject({
          statusCode: 400,
          message:
            "Either peeled_dispatch_id (processed) or dispatch_id (unprocessed) must be provided",
        });
      }

      console.log(
        "📦 Packing PROCESSED product from peeled_dispatch_id:",
        peeled_dispatch_id,
      );

      const peeledDispatch = await models.PeeledDispatches.findOne({
        where: { id: peeled_dispatch_id, is_active: true },
        include: [
          {
            model: models.PeelingProducts,
            as: "pp",
            include: [
              {
                model: models.ProductMaster,
                as: "ProductMaster",
                attributes: ["id", "grade_master_id", "size_master_id"],
              },
            ],
          },
          {
            model: models.QAChecklist,
            as: "qaCheck",
            attributes: ["id", "status"],
          },
        ],
      });

      if (!peeledDispatch) {
        return reject({
          statusCode: 404,
          message: "Peeled dispatch not found",
        });
      }

      // VALIDATION: Check and link QA record to peeled dispatch
      let qaRecord = peeledDispatch.qaCheck;

      if (!qaRecord && peeledDispatch.qa_checklist_id) {
        qaRecord = await models.QAChecklist.findByPk(
          peeledDispatch.qa_checklist_id,
        );
      }

      if (!qaRecord) {
        qaRecord = await models.QAChecklist.findOne({
          where: { peeled_dispatch_id: peeledDispatch.id },
        });

        if (qaRecord) {
          await peeledDispatch.update({ qa_checklist_id: qaRecord.id });
        }
      }

      // QA check is now optional - log warning if not found but allow packing
      if (qaRecord && qaRecord.status !== "PASS") {
        // Packing proceeds anyway - QA is informational
      }

      // Derive grade and size from product if not provided
      const derivedGradeId =
        grade_master_id || peeledDispatch.pp?.ProductMaster?.grade_master_id;
      const derivedSizeId =
        size_master_id || peeledDispatch.pp?.ProductMaster?.size_master_id;

      // Size is required; grade is optional (can be null for some products)
      if (!derivedSizeId) {
        return reject({
          statusCode: 400,
          message: "Could not determine size from product",
        });
      }

      // ✅ Use shared query builder for quantity validation
      const quantityResult = await getQuantityQuery(
        models,
        "peeledDispatches",
        peeled_dispatch_id,
      );

      if (!quantityResult?.peeled_dispatch_quantity) {
        return reject({
          statusCode: 420,
          message: "Invalid product quantity",
        });
      } else if (quantityResult.peeled_dispatch_quantity < packing_quantity) {
        return reject({
          statusCode: 420,
          message: "Packing quantity is greater than Dispatched quantity",
        });
      }

      const packing = await Packing.Insert(profile_id, {
        peeled_dispatch_id,
        dispatch_id: null, // No dispatch for peeled products
        order_id: peeledDispatch.order_id,
        unit_master_id,
        packing_quantity,
        grade_master_id: derivedGradeId,
        size_master_id: derivedSizeId,
        packaging_master_id,
        expiry_date,
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
      fastify.log.error(err);
      reject(err);
    }
  });
};
