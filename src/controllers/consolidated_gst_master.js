import { Op } from "sequelize";
import models from "../../models";

/**
 * CREATE GST MASTER
 */
export const Insert = async (profile_id, gst_master_data) => {
  if (!profile_id)
    throw { statusCode: 420, message: "user id must not be empty!" };

  if (!gst_master_data)
    throw { statusCode: 420, message: "gst master data must not be empty!" };

  if (!gst_master_data?.gst_name)
    throw { statusCode: 420, message: "gst name must not be empty!" };

  if (!gst_master_data?.hsn_code)
    throw { statusCode: 420, message: "hsn code must not be empty!" };

  try {
    const company_id = gst_master_data.company_id || null;

    // Check unique per company and hsn
    if (gst_master_data.hsn_code) {
      const existing = await models.ConsolidatedGstMaster.findOne({
        where: {
          company_id,
          hsn_code: gst_master_data.hsn_code,
          is_active: true,
        },
      });
      if (existing)
        throw {
          statusCode: 420,
          message: "hsn code already exists for company",
        };
    }

    return await models.ConsolidatedGstMaster.create({
      ...gst_master_data,
      company_id,
      created_by: profile_id,
    });
  } catch (err) {
    if (err?.name === "SequelizeUniqueConstraintError") {
      throw { statusCode: 420, message: "hsn code already exists!" };
    }
    throw err;
  }
};

/**
 * UPDATE GST MASTER
 */
export const Update = async (profile_id, id, gst_master_data) => {
  if (!id)
    throw { statusCode: 420, message: "gst master id must not be empty!" };

  if (!profile_id)
    throw { statusCode: 420, message: "user id must not be empty!" };

  if (!gst_master_data)
    throw { statusCode: 420, message: "gst master data must not be empty!" };

  const [updated] = await models.ConsolidatedGstMaster.update(
    {
      ...gst_master_data,
      updated_by: profile_id,
    },
    {
      where: { id, is_active: true },
      individualHooks: true,
    }
  );

  if (!updated) throw { statusCode: 420, message: "No gst master updated" };
  return { message: "Updated successfully" };
};

/**
 * GET GST MASTER BY ID
 */
export const Get = async (id) => {
  if (!id)
    throw { statusCode: 420, message: "gst master id must not be empty!" };

  const gst = await models.ConsolidatedGstMaster.findOne({
    where: { id, is_active: true },
  });

  if (!gst) throw { statusCode: 420, message: "GST master not found" };
  return { data: gst };
};

/**
 * GET ALL GST MASTERS
 */
export const GetAll = async ({
  start = 0,
  length = 10,
  gst_name = "",
  hsn_code = "",
  "search[value]": searchValue = "",
}) => {
  start = Number(start) || 0;
  length = Number(length) || 10;

  const where = {
    is_active: true,
  };

  // Manual filters
  if (gst_name) {
    where.gst_name = { [Op.iLike]: `%${gst_name}%` };
  }

  if (hsn_code) {
    where.hsn_code = { [Op.iLike]: `%${hsn_code}%` };
  }

  // Global search
  if (searchValue && searchValue.trim() !== "") {
    where[Op.or] = [
      { gst_name: { [Op.iLike]: `%${searchValue}%` } },
      { hsn_code: { [Op.iLike]: `%${searchValue}%` } },
    ];
  }

  const result = await models.ConsolidatedGstMaster.findAndCountAll({
    where,
    offset: start,
    limit: length,
    order: [["gst_name", "asc"]],
  });

  // Get total count without filters
  const totalCount = await models.ConsolidatedGstMaster.count({
    where: { is_active: true },
  });

  return {
    rows: result.rows.map((row) => row.toJSON()),
    recordsTotal: totalCount,
    recordsFiltered: result.count,
  };
};

/**
 * GET GST RATE BY HSN CODE
 */
export const GetByHsnCode = async (hsn_code) => {
  if (!hsn_code)
    throw { statusCode: 420, message: "HSN code must not be empty!" };

  const gstRate = await models.ConsolidatedGstMaster.findOne({
    where: {
      hsn_code: hsn_code.trim(),
      is_active: true,
    },
    attributes: [
      "gst_rate_id",
      "gst_name",
      "hsn_code",
      "cgst_rate",
      "sgst_rate",
      "igst_rate",
    ],
  });

  if (!gstRate) {
    throw {
      statusCode: 404,
      message: "GST rate not found for the given HSN code",
    };
  }

  return gstRate.toJSON();
};

/**
 * DELETE GST MASTER
 */
export const Delete = async (profile_id, id) => {
  if (!id)
    throw { statusCode: 420, message: "gst master id must not be empty!" };

  const gst = await models.ConsolidatedGstMaster.findByPk(id);
  if (!gst) throw { statusCode: 420, message: "GST master not found" };

  await gst.update({ is_active: false, deleted_by: profile_id });
  await gst.destroy();
  return { message: "Deleted successfully" };
};
