import { Op } from "sequelize";
import models from "../../models";

/**
 * CREATE CHART OF ACCOUNT
 */
export const Insert = async (profile_id, chart_of_accounts_data) => {
  if (!profile_id)
    throw { statusCode: 420, message: "user id must not be empty!" };

  if (!chart_of_accounts_data)
    throw {
      statusCode: 420,
      message: "chart of accounts data must not be empty!",
    };

  if (!chart_of_accounts_data?.account_code)
    throw { statusCode: 420, message: "account code must not be empty!" };

  if (!chart_of_accounts_data?.account_name)
    throw { statusCode: 420, message: "account name must not be empty!" };

  if (!chart_of_accounts_data?.account_type)
    throw { statusCode: 420, message: "account type must not be empty!" };

  try {
    const company_id = chart_of_accounts_data.company_id || null;

    // Check unique per company
    const existing = await models.ChartOfAccounts.findOne({
      where: {
        company_id,
        account_code: chart_of_accounts_data.account_code,
        is_active: true,
      },
    });
    if (existing)
      throw {
        statusCode: 420,
        message: "account code already exists for company",
      };

    return await models.ChartOfAccounts.create({
      ...chart_of_accounts_data,
      company_id,
      created_by: profile_id,
    });
  } catch (err) {
    if (err?.name === "SequelizeUniqueConstraintError") {
      throw { statusCode: 420, message: "account code already exists!" };
    }
    throw err;
  }
};

/**
 * UPDATE CHART OF ACCOUNT
 */
export const Update = async (profile_id, id, chart_of_accounts_data) => {
  if (!id) throw { statusCode: 420, message: "account id must not be empty!" };

  if (!profile_id)
    throw { statusCode: 420, message: "user id must not be empty!" };

  if (!chart_of_accounts_data)
    throw {
      statusCode: 420,
      message: "chart of accounts data must not be empty!",
    };

  const [updated] = await models.ChartOfAccounts.update(
    {
      ...chart_of_accounts_data,
      updated_by: profile_id,
    },
    {
      where: { id, is_active: true },
      individualHooks: true,
    }
  );

  if (!updated) throw { statusCode: 420, message: "No account updated" };
  return { message: "Updated successfully" };
};

/**
 * GET CHART OF ACCOUNT BY ID
 */
export const Get = async (id) => {
  if (!id) throw { statusCode: 420, message: "account id must not be empty!" };

  const account = await models.ChartOfAccounts.findOne({
    where: { id, is_active: true },
  });

  if (!account) throw { statusCode: 420, message: "Account not found" };
  return { data: account };
};

/**
 * GET ALL CHART OF ACCOUNTS
 */
export const GetAll = async ({
  start = 0,
  length = 10,
  account_name = "",
  account_code = "",
  "search[value]": searchValue = "",
}) => {
  start = Number(start) || 0;
  length = Number(length) || 10;

  const where = {
    is_active: true,
  };

  // Manual filters
  if (account_name) {
    where.account_name = { [Op.iLike]: `%${account_name}%` };
  }

  if (account_code) {
    where.account_code = { [Op.iLike]: `%${account_code}%` };
  }

  // Global search
  if (searchValue && searchValue.trim() !== "") {
    where[Op.or] = [
      { account_name: { [Op.iLike]: `%${searchValue}%` } },
      { account_code: { [Op.iLike]: `%${searchValue}%` } },
    ];
  }

  const result = await models.ChartOfAccounts.findAndCountAll({
    where,
    offset: start,
    limit: length,
    order: [["account_code", "asc"]],
  });

  // Get total count without filters
  const totalCount = await models.ChartOfAccounts.count({
    where: { is_active: true },
  });

  return {
    rows: result.rows.map((row) => row.toJSON()),
    recordsTotal: totalCount,
    recordsFiltered: result.count,
  };
};

/**
 * DELETE CHART OF ACCOUNT
 */
export const Delete = async (profile_id, id) => {
  if (!id) throw { statusCode: 420, message: "account id must not be empty!" };

  const account = await models.ChartOfAccounts.findByPk(id);
  if (!account) throw { statusCode: 420, message: "Account not found" };

  await account.update({ is_active: false, deleted_by: profile_id });
  await account.destroy();
  return { message: "Deleted successfully" };
};
