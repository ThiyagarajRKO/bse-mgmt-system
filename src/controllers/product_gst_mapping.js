import { Op } from "sequelize";
import models from "../../models";

/**
 * CREATE PRODUCT GST MAPPING
 */
export const Insert = async (profile_id, product_gst_mapping_data) => {
  if (!profile_id)
    throw { statusCode: 420, message: "user id must not be empty!" };

  if (!product_gst_mapping_data)
    throw {
      statusCode: 420,
      message: "product gst mapping data must not be empty!",
    };

  if (!product_gst_mapping_data?.gst_master_id)
    throw { statusCode: 420, message: "gst master id must not be empty!" };

  try {
    const tax_code_id = product_gst_mapping_data.tax_code_id || null;

    // Check unique per product/tax_code/gst_master
    const existing = await models.ProductGstMapping.findOne({
      where: {
        product_id: product_gst_mapping_data.product_id,
        tax_code_id,
        gst_master_id: product_gst_mapping_data.gst_master_id,
        is_active: true,
      },
    });
    if (existing)
      throw {
        statusCode: 420,
        message: "mapping already exists for product/tax_code/gst master",
      };

    // Validate product exists
    const product = await models.ProductMaster.findByPk(
      product_gst_mapping_data.product_id
    );
    if (!product)
      throw { statusCode: 420, message: "product id does not exist" };

    // Validate gst master exists
    const gst = await models.ConsolidatedGstMaster.findByPk(
      product_gst_mapping_data.gst_master_id
    );
    if (!gst)
      throw { statusCode: 420, message: "gst master id does not exist" };

    // Validate dates if provided
    if (
      product_gst_mapping_data.effective_from &&
      product_gst_mapping_data.effective_to
    ) {
      if (
        new Date(product_gst_mapping_data.effective_from) >
        new Date(product_gst_mapping_data.effective_to)
      ) {
        throw {
          statusCode: 420,
          message: "effective_from cannot be after effective_to",
        };
      }
    }

    return await models.ProductGstMapping.create({
      ...product_gst_mapping_data,
      tax_code_id,
      created_by: profile_id,
    });
  } catch (err) {
    if (err?.name === "SequelizeUniqueConstraintError") {
      throw { statusCode: 420, message: "mapping already exists!" };
    }
    throw err;
  }
};

/**
 * UPDATE PRODUCT GST MAPPING
 */
export const Update = async (profile_id, id, product_gst_mapping_data) => {
  if (!id) throw { statusCode: 420, message: "mapping id must not be empty!" };

  if (!profile_id)
    throw { statusCode: 420, message: "user id must not be empty!" };

  if (!product_gst_mapping_data)
    throw {
      statusCode: 420,
      message: "product gst mapping data must not be empty!",
    };

  const [updated] = await models.ProductGstMapping.update(
    {
      ...product_gst_mapping_data,
      updated_by: profile_id,
    },
    {
      where: { id, is_active: true },
      individualHooks: true,
    }
  );

  if (!updated) throw { statusCode: 420, message: "No mapping updated" };
  return { message: "Updated successfully" };
};

/**
 * GET PRODUCT GST MAPPING BY ID
 */
export const Get = async (id) => {
  if (!id) throw { statusCode: 420, message: "mapping id must not be empty!" };

  const mapping = await models.ProductGstMapping.findOne({
    where: { id, is_active: true },
    include: [
      {
        model: models.ConsolidatedGstMaster,
        as: "gst_master",
        attributes: [
          "id",
          "hsn_code",
          "gst_name",
          "cgst_rate",
          "sgst_rate",
          "igst_rate",
          "export_gst",
        ],
      },
      {
        model: models.ProductMaster,
        as: "product",
        attributes: ["id", "product_name"],
      },
    ],
  });

  if (!mapping) throw { statusCode: 420, message: "Mapping not found" };
  return { data: mapping };
};

/**
 * GET ALL PRODUCT GST MAPPINGS
 */
export const GetAll = async ({
  start = 0,
  length = 10,
  product_id = "",
  "search[value]": searchValue = "",
}) => {
  start = Number(start) || 0;
  length = Number(length) || 10;

  const where = {
    is_active: true,
  };

  // Manual filters
  if (product_id) {
    where.product_id = product_id;
  }

  // Global search
  if (searchValue && searchValue.trim() !== "") {
    where[Op.or] = [{ note: { [Op.iLike]: `%${searchValue}%` } }];
  }

  const result = await models.ProductGstMapping.findAndCountAll({
    where,
    include: [
      {
        model: models.ConsolidatedGstMaster,
        as: "gst_master",
        attributes: [
          "id",
          "hsn_code",
          "gst_name",
          "cgst_rate",
          "sgst_rate",
          "igst_rate",
          "export_gst",
        ],
      },
      {
        model: models.ProductMaster,
        as: "product",
        attributes: ["id", "product_name"],
      },
    ],
    offset: start,
    limit: length,
    order: [["created_at", "desc"]],
  });

  // Get total count without filters
  const totalCount = await models.ProductGstMapping.count({
    where: { is_active: true },
  });

  return {
    rows: result.rows.map((row) => row.toJSON()),
    recordsTotal: totalCount,
    recordsFiltered: result.count,
  };
};

/**
 * DELETE PRODUCT GST MAPPING
 */
export const Delete = async (profile_id, id) => {
  if (!id) throw { statusCode: 420, message: "mapping id must not be empty!" };

  const mapping = await models.ProductGstMapping.findByPk(id);
  if (!mapping) throw { statusCode: 420, message: "Mapping not found" };

  await mapping.update({ is_active: false, deleted_by: profile_id });
  await mapping.destroy();
  return { message: "Deleted successfully" };
};
