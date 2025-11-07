import { Op } from "sequelize";
import models from "../../models";

/**
 * CREATE COMPANY
 */
export const Insert = async (profile_id, company_master_data) => {
  if (!profile_id)
    throw { statusCode: 420, message: "user id must not be empty!" };

  if (!company_master_data)
    throw { statusCode: 420, message: "company data must not be empty!" };

  if (!company_master_data?.company_name)
    throw { statusCode: 420, message: "company name must not be empty!" };

  try {
    return await models.CompanyMaster.create({
      ...company_master_data,
      created_by: profile_id,
    });
  } catch (err) {
    if (err?.name === "SequelizeUniqueConstraintError") {
      throw { statusCode: 420, message: "company already exists!" };
    }
    throw err;
  }
};

/**
 * UPDATE COMPANY
 */
export const Update = async (profile_id, id, company_master_data) => {
  if (!id) throw { statusCode: 420, message: "company id must not be empty!" };

  if (!profile_id)
    throw { statusCode: 420, message: "user id must not be empty!" };

  if (!company_master_data)
    throw { statusCode: 420, message: "company data must not be empty!" };

  const [updated] = await models.CompanyMaster.update(
    {
      ...company_master_data,
      updated_by: profile_id,
    },
    {
      where: { id, is_active: true },
      individualHooks: true,
    }
  );

  return updated;
};

/**
 * GET ONE COMPANY
 */
export const Get = async ({ id }) => {
  if (!id) throw { statusCode: 420, message: "company ID must not be empty!" };

  return await models.CompanyMaster.findOne({
    where: { id, is_active: true },
  });
};

/**
 * GET ALL COMPANIES (DATATABLE FORMAT)
 */
export const GetAll = async ({
  start = 0,
  length = 10,
  company_name = "",
  tableSearch = "",
  search = "",
}) => {
  start = Number(start) || 0;
  length = Number(length) || 10;

  const where = { is_active: true };

  if (company_name) {
    where.company_name = { [Op.iLike]: `%${company_name}%` };
  }

  const searchTerm = tableSearch || search;

  if (searchTerm) {
    where[Op.or] = [
      { company_name: { [Op.iLike]: `%${searchTerm}%` } },
      { company_address: { [Op.iLike]: `%${searchTerm}%` } },
      { company_country: { [Op.iLike]: `%${searchTerm}%` } },
      { company_gstin: { [Op.iLike]: `%${searchTerm}%` } },
      { company_pan: { [Op.iLike]: `%${searchTerm}%` } },
      { company_bank_ac: { [Op.iLike]: `%${searchTerm}%` } },
      { company_ifsc: { [Op.iLike]: `%${searchTerm}%` } },
      { company_currency: { [Op.iLike]: `%${searchTerm}%` } },
    ];
  }

  return await models.CompanyMaster.findAndCountAll({
    where,
    offset: start,
    limit: length,
    order: [["created_at", "desc"]],
  });
};

/**
 * SOFT DELETE COMPANY
 */
export const Delete = async ({ profile_id, id }) => {
  if (!id) throw { statusCode: 420, message: "company ID must not be empty!" };

  if (!profile_id)
    throw { statusCode: 420, message: "user id must not be empty!" };

  return await models.CompanyMaster.update(
    {
      is_active: false,
      updated_by: profile_id,
    },
    {
      where: { id, created_by: profile_id },
      individualHooks: true,
    }
  );
};
