import { PeeledDispatches, Packing } from "../../../controllers";
import models from "../../../../models";

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
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Get peeled dispatch with product information
      const peeledDispatch = await models.PeeledDispatches.findOne({
        where: { id: peeled_dispatch_id, is_active: true },
        include: [
          {
            model: models.PeelingProducts,
            as: "pp",
            include: [
              {
                model: models.ProductMaster,
                include: [
                  {
                    model: models.GradeMaster,
                    attributes: ["id"],
                  },
                  {
                    model: models.SizeMaster,
                    attributes: ["id"],
                  },
                ],
              },
            ],
          },
        ],
      });

      if (!peeledDispatch) {
        return reject({
          statusCode: 404,
          message: "Peeled dispatch not found",
        });
      }

      // Derive grade and size from product if not provided
      const derivedGradeId =
        grade_master_id || peeledDispatch.pp.ProductMaster?.GradeMaster?.id;
      const derivedSizeId =
        size_master_id || peeledDispatch.pp.ProductMaster?.SizeMaster?.id;

      if (!derivedGradeId || !derivedSizeId) {
        return reject({
          statusCode: 400,
          message: "Could not determine grade and size from product",
        });
      }

      const { peeled_dispatch_quantity } = await PeeledDispatches.GetQuantity({
        id: peeled_dispatch_id,
      });

      if (!peeled_dispatch_quantity) {
        return reject({
          statusCode: 420,
          message: "Invalid product quantity",
        });
      } else if (peeled_dispatch_quantity < packing_quantity) {
        return reject({
          statusCode: 420,
          message: "Packing quantity is greater than Dispatched quantity",
        });
      }

      const packing = await Packing.Insert(profile_id, {
        peeled_dispatch_id,
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
