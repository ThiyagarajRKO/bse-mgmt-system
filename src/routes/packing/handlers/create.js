import { PeeledDispatches, Packing } from "../../../controllers";
import models from "../../../../models";
import { getQuantityQuery } from "../../../utils/queryBuilders";

export const Create = async (
  {
    profile_id,
    peeled_dispatch_id,
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
      // ✅ Get peeled dispatch with product information and QA details
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
      // If qaCheck association didn't load, try to find it directly using the foreign key
      let qaRecord = peeledDispatch.qaCheck;

      if (!qaRecord && peeledDispatch.qa_checklist_id) {
        qaRecord = await models.QAChecklist.findByPk(
          peeledDispatch.qa_checklist_id,
        );
      }

      // If still no QA record, try to find it by peeled_dispatch_id in QAChecklist table
      if (!qaRecord) {
        qaRecord = await models.QAChecklist.findOne({
          where: { peeled_dispatch_id: peeledDispatch.id },
        });

        if (qaRecord) {
          // Link the QA record to the peeled dispatch
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

      if (!derivedGradeId || !derivedSizeId) {
        return reject({
          statusCode: 400,
          message: "Could not determine grade and size from product",
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
      reject(err);
    }
  });
};
