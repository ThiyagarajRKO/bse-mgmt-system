import { Op } from "sequelize";
import models from "../../models";

/**
 * CREATE TAX CODE
 */
export const Insert = async (profile_id, tax_code_master_data) => {
  if (!profile_id)
    throw { statusCode: 420, message: "user id must not be empty!" };

  if (!tax_code_master_data)
    throw { statusCode: 420, message: "tax code data must not be empty!" };

  if (!tax_code_master_data?.tax_code)
    throw { statusCode: 420, message: "tax code must not be empty!" };

  if (!tax_code_master_data?.tax_code_name)
    throw { statusCode: 420, message: "tax code name must not be empty!" };

  // gst_rate_id is now optional

  try {
    // Check unique tax_code globally (since company_id is removed)
    const existing = await models.TaxCodeMaster.findOne({
      where: {
        tax_code: tax_code_master_data.tax_code,
        is_active: true,
      },
    });
    if (existing)
      throw {
        statusCode: 420,
        message: "tax code already exists",
      };

    // Validate GST rate exists if provided (optional)
    if (tax_code_master_data.gst_rate_id) {
      const gstRate = await models.ConsolidatedGstMaster.findOne({
        where: {
          gst_rate_id: tax_code_master_data.gst_rate_id,
          is_active: true,
        },
      });
      if (!gstRate)
        throw { statusCode: 420, message: "GST rate does not exist" };
    }

    return await models.TaxCodeMaster.create({
      ...tax_code_master_data,
      created_by: profile_id,
    });
  } catch (err) {
    if (err?.name === "SequelizeUniqueConstraintError") {
      throw { statusCode: 420, message: "tax code name already exists!" };
    }
    throw err;
  }
};

/**
 * UPDATE TAX CODE
 */
export const Update = async (profile_id, id, tax_code_master_data) => {
  if (!id) throw { statusCode: 420, message: "tax code id must not be empty!" };

  if (!profile_id)
    throw { statusCode: 420, message: "user id must not be empty!" };

  if (!tax_code_master_data)
    throw { statusCode: 420, message: "tax code data must not be empty!" };

  // gst_rate_id is now optional

  const [updated] = await models.TaxCodeMaster.update(
    {
      ...tax_code_master_data,
      updated_by: profile_id,
    },
    {
      where: { tax_code_id: id, is_active: true },
      individualHooks: true,
    }
  );

  if (!updated) throw { statusCode: 420, message: "No tax code updated" };
  return { message: "Updated successfully" };
};

/**
 * GET TAX CODE BY ID
 */
export const Get = async (id) => {
  if (!id) throw { statusCode: 420, message: "tax code id must not be empty!" };

  const tax = await models.TaxCodeMaster.findOne({
    where: { tax_code_id: id, is_active: true },
    include: [
      {
        model: models.ConsolidatedGstMaster,
        as: "gstMaster",
        attributes: [
          "gst_rate_id",
          "gst_name",
          "hsn_code",
          "cgst_rate",
          "sgst_rate",
          "igst_rate",
        ],
      },
      {
        model: models.CompanyMaster,
        as: "company",
        attributes: ["id", "company_name", "company_short_name"],
      },
    ],
  });

  if (!tax) throw { statusCode: 420, message: "Tax code not found" };
  return { data: tax };
};

/**
 * GET ALL TAX CODES
 */
export const GetAll = async ({
  start = 0,
  length = 10,
  tax_code = "",
  tax_code_name = "",
  gst_rate_id = "",
  tax_type = "",
  supply_type = "",
  is_export_applicable = "",
  "search[value]": searchValue = "",
}) => {
  start = Number(start) || 0;
  length = Number(length) || 10;

  const where = {
    is_active: true,
  };

  // Manual filters
  if (tax_code) {
    where.tax_code = { [Op.iLike]: `%${tax_code}%` };
  }

  if (tax_code_name) {
    where.tax_code_name = { [Op.iLike]: `%${tax_code_name}%` };
  }

  if (gst_rate_id) {
    where.gst_rate_id = gst_rate_id;
  }

  if (tax_type && tax_type !== "") {
    where.tax_type = tax_type;
  }

  if (supply_type && supply_type !== "") {
    where.supply_type = supply_type;
  }

  if (is_export_applicable !== "" && is_export_applicable !== undefined) {
    where.is_export_applicable = is_export_applicable === "true";
  }

  // Global search
  if (searchValue && searchValue.trim() !== "") {
    where[Op.or] = [
      { tax_code: { [Op.iLike]: `%${searchValue}%` } },
      { tax_code_name: { [Op.iLike]: `%${searchValue}%` } },
      { description: { [Op.iLike]: `%${searchValue}%` } },
      { gst_rate_id: { [Op.iLike]: `%${searchValue}%` } },
      { hsn_code: { [Op.iLike]: `%${searchValue}%` } },
    ];
  }

  const result = await models.TaxCodeMaster.findAndCountAll({
    where,
    include: [
      {
        model: models.ConsolidatedGstMaster,
        as: "gstMaster",
        attributes: [
          "gst_rate_id",
          "gst_name",
          "hsn_code",
          "cgst_rate",
          "sgst_rate",
          "igst_rate",
        ],
        required: false,
      },
    ],
    offset: start,
    limit: length,
    order: [["tax_code_name", "asc"]],
  });

  // Get total count without filters
  const totalCount = await models.TaxCodeMaster.count({
    where: { is_active: true },
  });

  return {
    data: result.rows.map((row) => row.toJSON()),
    recordsTotal: totalCount,
    recordsFiltered: result.count,
  };
};

/**
 * DELETE TAX CODE
 */
export const Delete = async (profile_id, id) => {
  if (!id) throw { statusCode: 420, message: "tax code id must not be empty!" };

  const tax = await models.TaxCodeMaster.findOne({
    where: { tax_code_id: id },
  });
  if (!tax) throw { statusCode: 420, message: "Tax code not found" };

  await tax.update({ is_active: false, deleted_by: profile_id });
  await tax.destroy();
  return { message: "Deleted successfully" };
};
