import models from "../../../../models";

export const GetGradesByCategory = async ({ category_id }) => {
  try {
    if (!category_id) {
      return {
        statusCode: 420,
        message: "Category ID must not be empty!",
        data: [],
      };
    }

    // Get all grades associated with the given category
    const grades = await models.GradeMaster.findAll({
      attributes: ["id", "grade_name"],
      include: [
        {
          model: models.ProductCategoryGradeMapping,
          attributes: [],
          where: { product_category_master_id: category_id },
          required: true,
        },
      ],
      where: { is_active: true },
      raw: true,
      order: [["grade_name", "ASC"]],
    });

    return {
      statusCode: 200,
      message: "Grades retrieved successfully",
      data: {
        rows: grades,
        count: grades.length,
      },
    };
  } catch (err) {
    console.error("Error retrieving grades for category:", err.message);
    return {
      statusCode: 500,
      message: err?.message || "Error retrieving grades",
      data: [],
    };
  }
};

export default GetGradesByCategory;
