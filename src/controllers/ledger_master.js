import { Op } from "sequelize";
import models from "../../models";

/**
 * CREATE LEDGER
 */
export const Insert = async (profile_id, ledger_master_data) => {
  if (!profile_id)
    throw { statusCode: 420, message: "user id must not be empty!" };

  if (!ledger_master_data)
    throw { statusCode: 420, message: "ledger data must not be empty!" };

  if (!ledger_master_data?.ledger_code)
    throw { statusCode: 420, message: "ledger code must not be empty!" };

  if (!ledger_master_data?.ledger_name)
    throw { statusCode: 420, message: "ledger name must not be empty!" };

  if (!ledger_master_data?.coa_account_id)
    throw { statusCode: 420, message: "coa account id must not be empty!" };

  if (!ledger_master_data?.company_id)
    throw { statusCode: 420, message: "company id must not be empty!" };

  try {
    // Check unique per company
    const existing = await models.LedgerMaster.findOne({
      where: {
        company_id: ledger_master_data.company_id,
        ledger_code: ledger_master_data.ledger_code,
        is_active: true,
      },
    });
    if (existing)
      throw {
        statusCode: 420,
        message: "ledger code already exists for company",
      };

    // Validate coa_account_id exists
    const coa = await models.ChartOfAccounts.findByPk(
      ledger_master_data.coa_account_id
    );
    if (!coa)
      throw { statusCode: 420, message: "coa account id does not exist" };

    return await models.LedgerMaster.create({
      ...ledger_master_data,
      created_by: profile_id,
    });
  } catch (err) {
    if (err?.name === "SequelizeUniqueConstraintError") {
      throw { statusCode: 420, message: "ledger code already exists!" };
    }
    throw err;
  }
};

/**
 * UPDATE LEDGER
 */
export const Update = async (profile_id, id, ledger_master_data) => {
  if (!id) throw { statusCode: 420, message: "ledger id must not be empty!" };

  if (!profile_id)
    throw { statusCode: 420, message: "user id must not be empty!" };

  if (!ledger_master_data)
    throw { statusCode: 420, message: "ledger data must not be empty!" };

  const [updated] = await models.LedgerMaster.update(
    {
      ...ledger_master_data,
      updated_by: profile_id,
    },
    {
      where: { id, is_active: true },
      individualHooks: true,
    }
  );

  if (!updated) throw { statusCode: 420, message: "No ledger updated" };
  return { message: "Updated successfully" };
};

/**
 * GET LEDGER BY ID
 */
export const Get = async (id) => {
  if (!id) throw { statusCode: 420, message: "ledger id must not be empty!" };

  const ledger = await models.LedgerMaster.findOne({
    where: { id, is_active: true },
    include: [
      {
        model: models.ChartOfAccounts,
        as: "coa_account",
        attributes: ["id", "account_name"],
      },
    ],
  });

  if (!ledger) throw { statusCode: 420, message: "Ledger not found" };
  return { data: ledger };
};

/**
 * GET ALL LEDGERS
 */
export const GetAll = async ({
  start = 0,
  length = 10,
  ledger_name = "",
  ledger_code = "",
  "search[value]": searchValue = "",
}) => {
  start = Number(start) || 0;
  length = Number(length) || 10;

  const where = {
    is_active: true,
  };

  // Manual filters
  if (ledger_name) {
    where.ledger_name = { [Op.iLike]: `%${ledger_name}%` };
  }

  if (ledger_code) {
    where.ledger_code = { [Op.iLike]: `%${ledger_code}%` };
  }

  // Global search
  if (searchValue && searchValue.trim() !== "") {
    where[Op.or] = [
      { ledger_name: { [Op.iLike]: `%${searchValue}%` } },
      { ledger_code: { [Op.iLike]: `%${searchValue}%` } },
    ];
  }

  const result = await models.LedgerMaster.findAndCountAll({
    where,
    include: [
      {
        model: models.ChartOfAccounts,
        as: "coa_account",
        attributes: ["id", "account_name"],
      },
    ],
    offset: start,
    limit: length,
    order: [["ledger_code", "asc"]],
  });

  // Get total count without filters
  const totalCount = await models.LedgerMaster.count({
    where: { is_active: true },
  });

  return {
    rows: result.rows.map((row) => row.toJSON()),
    recordsTotal: totalCount,
    recordsFiltered: result.count,
  };
};

/**
 * DELETE LEDGER
 */
export const Delete = async (profile_id, id) => {
  if (!id) throw { statusCode: 420, message: "ledger id must not be empty!" };

  const ledger = await models.LedgerMaster.findByPk(id);
  if (!ledger) throw { statusCode: 420, message: "Ledger not found" };

  await ledger.update({ is_active: false, deleted_by: profile_id });
  await ledger.destroy();
  return { message: "Deleted successfully" };
};
