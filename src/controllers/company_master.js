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
  "search[value]": searchValue = "",
}) => {
  start = Number(start) || 0;
  length = Number(length) || 10;

  const where = {
    is_active: true,
  };

  // Manual filter
  if (company_name) {
    where.company_name = { [Op.iLike]: `%${company_name}%` };
  }

  // Global search (wrapped inside AND to avoid wiping out base filters)
  if (searchValue && searchValue.trim() !== "") {
    where[Op.and] = [
      {
        [Op.or]: [
          { company_name: { [Op.iLike]: `%${searchValue}%` } },
          { company_address: { [Op.iLike]: `%${searchValue}%` } },
          { company_country: { [Op.iLike]: `%${searchValue}%` } },
          { company_gstin: { [Op.iLike]: `%${searchValue}%` } },
          { company_pan: { [Op.iLike]: `%${searchValue}%` } },
          { company_bank_ac: { [Op.iLike]: `%${searchValue}%` } },
          { company_ifsc: { [Op.iLike]: `%${searchValue}%` } },
          { company_currency: { [Op.iLike]: `%${searchValue}%` } },
        ],
      },
    ];
  }

  const result = await models.CompanyMaster.findAndCountAll({
    where,
    offset: start,
    limit: length,
    order: [["created_at", "desc"]],
  });

  return {
    rows: result.rows,
    count: result.count,
  };
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
