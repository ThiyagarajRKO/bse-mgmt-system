import models from "../../../../models";

export const GetSizesByGrade = async ({ grade_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!grade_id) {
        return reject({
          statusCode: 420,
          message: "Grade ID must not be empty!",
        });
      }

      // Fetch all sizes that are mapped to this grade
      const sizes = await models.GradeSizeMapping.findAll({
        where: {
          grade_id,
        },
        include: [
          {
            model: models.SizeMaster,
            attributes: ["id", "size", "unit_of_measure"],
            where: {
              is_active: true,
            },
            required: true,
          },
        ],
        attributes: [],
        raw: false,
      });

      // Format response
      const rows = sizes.map((mapping) => ({
        id: mapping.SizeMaster.id,
        size: mapping.SizeMaster.size,
        unit_of_measure: mapping.SizeMaster.unit_of_measure,
      }));

      resolve({
        statusCode: 200,
        message: "Sizes fetched successfully",
        data: {
          rows,
          count: rows.length,
        },
      });
    } catch (err) {
      reject(err);
    }
  });
};
