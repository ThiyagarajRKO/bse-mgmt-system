import models from "../../models";

export const getPostPackQAByPackingId = async (packingId) => {
  try {
    const qa = await models.PostPackQAInspection.findOne({
      where: {
        packing_id: packingId,
        is_active: true,
      },
      include: [
        {
          model: models.UserProfiles,
          as: "inspector",
          attributes: ["id", "full_name"],
        },
        {
          model: models.UserProfiles,
          as: "approver",
          attributes: ["id", "full_name"],
        },
        {
          model: models.Packing,
          as: "packing",
          attributes: ["id", "lot_no", "order_no", "order_id"],
          required: false,
          include: [
            {
              model: models.Orders,
              attributes: ["id", "order_no"],
              required: false,
            },
          ],
        },
      ],
      raw: false,
    });
    return qa;
  } catch (err) {
    console.error("[PostPackQA] Error fetching QA by packing ID:", err.message);
    throw err;
  }
};

export const createPostPackQA = async (profileId, qaData) => {
  try {
    if (!qaData?.packing_id) {
      return {
        status: false,
        message: "Packing ID is required",
      };
    }

    // Get packing details to extract order_id if not provided
    if (!qaData.order_id) {
      const packing = await models.Packing.findOne({
        where: { id: qaData.packing_id, is_active: true },
        attributes: ["order_id"],
      });
      if (packing) {
        qaData.order_id = packing.order_id;
      }
    }

    qaData.created_by = profileId;

    // Use provided inspector or default to current profile
    if (!qaData.inspected_by) {
      qaData.inspected_by = profileId;
    }

    // Use provided timestamp or default to current time
    if (!qaData.inspected_at) {
      qaData.inspected_at = new Date();
    }

    const result = await models.PostPackQAInspection.create(qaData, {
      include: [
        { model: models.UserProfiles, as: "inspector" },
        { model: models.UserProfiles, as: "approver" },
      ],
    });

    console.log("[PostPackQA] Created new inspection:", result.id);

    return {
      status: true,
      message: "Post-pack QA inspection created successfully",
      data: result,
    };
  } catch (err) {
    console.error("[PostPackQA] Error creating inspection:", err.message);
    return {
      status: false,
      message: err.message,
    };
  }
};

export const updatePostPackQA = async (profileId, qaId, qaData) => {
  try {
    if (!qaId) {
      return {
        status: false,
        message: "QA ID is required",
      };
    }

    const qa = await models.PostPackQAInspection.findOne({
      where: { id: qaId, is_active: true },
    });

    if (!qa) {
      return {
        status: false,
        message: "Post-pack QA inspection not found",
      };
    }

    // Only allow approved_by to be set by approver
    if (qaData?.qa_status && !qaData?.approved_by) {
      qaData.approved_by = profileId;
      qaData.approved_at = new Date();
    }

    qaData.updated_by = profileId;
    qaData.updated_at = new Date();

    await qa.update(qaData);

    console.log("[PostPackQA] Updated inspection:", qaId);

    return {
      status: true,
      message: "Post-pack QA inspection updated successfully",
      data: qa,
    };
  } catch (err) {
    console.error("[PostPackQA] Error updating inspection:", err.message);
    return {
      status: false,
      message: err.message,
    };
  }
};

export const getQADecisionSummary = async (packingId) => {
  try {
    const qa = await models.PostPackQAInspection.findOne({
      where: {
        packing_id: packingId,
        is_active: true,
      },
      attributes: [
        "qa_status",
        "inventory_status",
        "follow_up_action",
        "qa_decision_remarks",
        "inspected_at",
        "approved_at",
      ],
    });

    if (!qa) {
      return null;
    }

    // Calculate compliance score
    const checks = await getQACompliance(qa);

    return {
      qa_status: qa.qa_status,
      inventory_status:
        qa.inventory_status ||
        (qa.qa_status === "PASS"
          ? "SALEABLE"
          : qa.qa_status === "HOLD"
            ? "BLOCKED"
            : "REWORK"),
      follow_up_action: qa.follow_up_action,
      remarks: qa.qa_decision_remarks,
      inspected_at: qa.inspected_at,
      approved_at: qa.approved_at,
      compliance: checks,
    };
  } catch (err) {
    console.error("[PostPackQA] Error getting decision summary:", err.message);
    throw err;
  }
};

export const getQACompliance = async (qa) => {
  const compliance = {
    seal_integrity: qa.seal_integrity,
    vacuum: qa.vacuum_proper,
    tray_condition: !qa.tray_damage,
    carton_condition: qa.carton_condition,
    ice_buildup: qa.ice_buildup_acceptable,
    label: qa.label_correct,
    net_weight: qa.net_weight_compliant,
    glazing: qa.glazing_compliant,
    appearance: qa.product_appearance_pass,
    foreign_matter: !qa.foreign_matter_found,
    temperature: qa.temperature_compliant,
    carton_weight: qa.carton_weight_compliant,
    traceability: qa.traceability_verified,
  };

  const totalChecks = Object.keys(compliance).length;
  const passedChecks = Object.values(compliance).filter(
    (v) => v === true,
  ).length;
  const compliance_percentage = Math.round((passedChecks / totalChecks) * 100);

  return {
    details: compliance,
    total_checks: totalChecks,
    passed_checks: passedChecks,
    failed_checks: totalChecks - passedChecks,
    compliance_percentage,
  };
};

export const bulkGetQAByPackingIds = async (packingIds) => {
  try {
    const qaRecords = await models.PostPackQAInspection.findAll({
      where: {
        packing_id: packingIds,
        is_active: true,
      },
      attributes: [
        "packing_id",
        "qa_status",
        "inventory_status",
        "inspected_at",
      ],
      raw: true,
    });

    return qaRecords;
  } catch (err) {
    console.error("[PostPackQA] Error bulk fetching QA:", err.message);
    throw err;
  }
};

export const getQAStatistics = async (startDate, endDate) => {
  try {
    const stats = await models.PostPackQAInspection.findAll({
      where: {
        inspected_at: {
          [db.Sequelize.Op.between]: [startDate, endDate],
        },
        is_active: true,
      },
      attributes: [
        [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "total_inspections"],
        [
          db.Sequelize.fn(
            "COUNT",
            db.Sequelize.fn(
              "IF",
              db.Sequelize.where(
                db.Sequelize.col("qa_status"),
                db.Sequelize.Op.eq,
                "PASS",
              ),
              1,
              null,
            ),
          ),
          "passed_count",
        ],
        [
          db.Sequelize.fn(
            "COUNT",
            db.Sequelize.fn(
              "IF",
              db.Sequelize.where(
                db.Sequelize.col("qa_status"),
                db.Sequelize.Op.eq,
                "HOLD",
              ),
              1,
              null,
            ),
          ),
          "hold_count",
        ],
        [
          db.Sequelize.fn(
            "COUNT",
            db.Sequelize.fn(
              "IF",
              db.Sequelize.where(
                db.Sequelize.col("qa_status"),
                db.Sequelize.Op.eq,
                "FAIL",
              ),
              1,
              null,
            ),
          ),
          "failed_count",
        ],
      ],
      raw: true,
    });

    return (
      stats[0] || {
        total_inspections: 0,
        passed_count: 0,
        hold_count: 0,
        failed_count: 0,
      }
    );
  } catch (err) {
    console.error("[PostPackQA] Error getting statistics:", err.message);
    throw err;
  }
};

export const listPostPackQA = async (offset = 0, limit = 10) => {
  try {
    const { count, rows } = await models.PostPackQAInspection.findAndCountAll({
      where: {
        is_active: true,
      },
      include: [
        {
          model: models.UserProfiles,
          as: "inspector",
          attributes: ["id", "full_name"],
        },
        {
          model: models.Packing,
          as: "packing",
          attributes: ["id", "lot_no", "order_no", "order_id"],
          required: false,
          include: [
            {
              model: models.Orders,
              attributes: ["id", "order_no"],
              required: false,
            },
            {
              model: models.PeeledDispatches,
              as: "pd",
              attributes: ["id"],
              required: false,
              include: [
                {
                  model: models.PeelingProducts,
                  as: "pp",
                  attributes: ["id", "product_master_id"],
                  required: false,
                  include: [
                    {
                      model: models.ProductMaster,
                      attributes: ["id", "product_name"],
                      required: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      attributes: [
        "id",
        "created_at",
        "packing_id",
        "batch_id",
        "qa_status",
        "temperature_core",
        "inspected_by",
      ],
      order: [["created_at", "DESC"]],
      offset,
      limit,
      raw: false,
      subQuery: false,
    });

    console.log("[PostPackQA] Returned rows count:", rows.length);
    if (rows.length > 0) {
      console.log(
        "[PostPackQA] First row Packing:",
        JSON.stringify(rows[0].Packing, null, 2),
      );
    }

    return {
      data: rows,
      count,
      offset,
      limit,
    };
  } catch (err) {
    console.error("[PostPackQA] Error listing inspections:", err.message);
    throw err;
  }
};

export const getPostPackQAById = async (qa_id) => {
  try {
    const qa = await models.PostPackQAInspection.findOne({
      where: { id: qa_id, is_active: true },
      include: [
        {
          model: models.UserProfiles,
          as: "inspector",
          attributes: ["id", "full_name"],
        },
      ],
      raw: false,
    });
    return qa;
  } catch (err) {
    console.error("[PostPackQA] Error getting inspection by ID:", err.message);
    throw err;
  }
};
