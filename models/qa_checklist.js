"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class QAChecklist extends Model {
    static associate(models) {
      if (models.UserProfiles) {
        QAChecklist.belongsTo(models.UserProfiles, {
          as: "createdByUser",
          foreignKey: "created_by",
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        });

        QAChecklist.belongsTo(models.UserProfiles, {
          as: "updatedByUser",
          foreignKey: "updated_by",
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        });
      }

      if (models.PeeledDispatches) {
        QAChecklist.belongsTo(models.PeeledDispatches, {
          as: "peeledDispatch",
          foreignKey: "peeled_dispatch_id",
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        });

        QAChecklist.hasMany(models.PeeledDispatches, {
          foreignKey: "qa_checklist_id",
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        });
      }

      if (models.PeelingProducts) {
        QAChecklist.belongsTo(models.PeelingProducts, {
          as: "peeledProduct",
          foreignKey: "peeled_product_id",
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        });
      }

      if (models.Orders) {
        QAChecklist.belongsTo(models.Orders, {
          as: "order",
          foreignKey: "order_id",
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        });
      }

      if (models.Peeling) {
        QAChecklist.belongsTo(models.Peeling, {
          as: "peeling",
          foreignKey: "peeling_id",
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        });
      }
    }

    // Instance methods
    isPassedQA() {
      return this.status === "PASS";
    }

    isFailedQA() {
      return this.status === "FAIL";
    }

    isPendingQA() {
      return this.status === "PENDING";
    }
  }

  QAChecklist.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      lot_no: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Lot number from procurement",
      },
      order_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Reference to sales order",
      },
      peeling_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Reference to peeling record",
      },
      peeled_product_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment:
          "Reference to peeled product record (between PeelingProducts and PeeledDispatches)",
      },
      peeled_dispatch_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Reference to peeled dispatch record",
      },
      product: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Product name/form",
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: "Quantity in kg",
        get() {
          const value = this.getDataValue("quantity");
          return value ? parseFloat(value) : null;
        },
      },
      broken_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: "Broken percentage (%)",
        get() {
          const value = this.getDataValue("broken_percentage");
          return value ? parseFloat(value) : null;
        },
      },
      glazing_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: "Glazing percentage (%)",
        get() {
          const value = this.getDataValue("glazing_percentage");
          return value ? parseFloat(value) : null;
        },
      },
      temperature: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: "Temperature in Celsius",
        get() {
          const value = this.getDataValue("temperature");
          return value ? parseFloat(value) : null;
        },
      },
      odour_status: {
        type: DataTypes.ENUM("GOOD", "ACCEPTABLE", "UNACCEPTABLE"),
        allowNull: true,
        comment: "Odour status",
      },
      appearance_status: {
        type: DataTypes.ENUM("GOOD", "ACCEPTABLE", "POOR"),
        allowNull: true,
        comment: "Appearance status",
      },
      foreign_matter: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: "Foreign matter detected",
      },
      sample_size: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: "Sample size in kg",
        get() {
          const value = this.getDataValue("sample_size");
          return value ? parseFloat(value) : null;
        },
      },
      net_weight_avg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: "Net weight average in kg",
        get() {
          const value = this.getDataValue("net_weight_avg");
          return value ? parseFloat(value) : null;
        },
      },
      status: {
        type: DataTypes.ENUM("PENDING", "PASS", "FAIL", "ON_HOLD"),
        defaultValue: "PENDING",
        allowNull: false,
        comment: "QA inspection status",
      },
      inspection_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Date of QA inspection",
      },
      inspector_name: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Name of QA inspector",
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Additional remarks/notes",
      },
      defects: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Defects found during inspection",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "QA Notes",
      },
      foreign_matter_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Foreign matter notes",
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "qa_checklist",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );

  // before create we try to populate order_id based on any linked entities so
  // downstream reporting/filters can use the column without needing to
  // traverse the entire join tree.
  QAChecklist.beforeCreate(async (data, options) => {
    try {
      if (!data.order_id) {
        let inferred = null;
        const { peeled_dispatch_id, peeled_product_id, peeling_id } = data;
        const seq = QAChecklist.sequelize;

        if (peeled_dispatch_id) {
          const pd = await seq.models.PeeledDispatches.findOne({
            attributes: ["order_id"],
            where: { id: peeled_dispatch_id, is_active: true },
            raw: true,
          });
          if (pd && pd.order_id) inferred = pd.order_id;
        }

        if (!inferred && peeled_product_id) {
          // find the peeled dispatch record which references this product
          const pd2 = await seq.models.PeeledDispatches.findOne({
            attributes: ["order_id"],
            where: { peeled_product_id: peeled_product_id, is_active: true },
            raw: true,
          });
          if (pd2 && pd2.order_id) inferred = pd2.order_id;
        }

        if (!inferred && peeling_id) {
          const p = await seq.models.Peeling.findOne({
            attributes: ["order_id"],
            where: { id: peeling_id, is_active: true },
            raw: true,
          });
          if (p && p.order_id) inferred = p.order_id;
        }

        if (inferred) {
          data.order_id = inferred;
        }
      }
      data.created_by = options.profile_id;
    } catch (err) {
      console.log("Error populating QA order_id:", err?.message || err);
    }
  });

  // Static methods
  QAChecklist.findByBatchNo = async function (batchNo) {
    return this.findOne({
      where: { batch_no: batchNo },
    });
  };

  QAChecklist.findPassedByBatchNo = async function (batchNo) {
    return this.findOne({
      where: {
        batch_no: batchNo,
        status: "PASS",
      },
    });
  };

  QAChecklist.findByPeelingId = async function (peelingId) {
    return this.findAll({
      where: { peeling_id: peelingId },
      order: [["created_at", "DESC"]],
    });
  };

  QAChecklist.findPendingRecords = async function () {
    return this.findAll({
      where: { status: "PENDING" },
      order: [["created_at", "ASC"]],
    });
  };

  QAChecklist.findFailedRecords = async function () {
    return this.findAll({
      where: { status: "FAIL" },
      order: [["created_at", "ASC"]],
    });
  };

  return QAChecklist;
};
