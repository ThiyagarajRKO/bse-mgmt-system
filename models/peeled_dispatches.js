"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PeeledDispatches extends Model {
    static associate(models) {
      PeeledDispatches.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PeeledDispatches.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PeeledDispatches.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PeeledDispatches.belongsTo(models.PeelingProducts, {
        as: "pp",
        foreignKey: "peeled_product_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PeeledDispatches.belongsTo(models.UnitMaster, {
        foreignKey: "unit_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PeeledDispatches.belongsTo(models.VehicleMaster, {
        foreignKey: "vehicle_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PeeledDispatches.belongsTo(models.DriverMaster, {
        foreignKey: "driver_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PeeledDispatches.belongsTo(models.Orders, {
        foreignKey: "order_id",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      if (models.QAChecklist) {
        PeeledDispatches.belongsTo(models.QAChecklist, {
          as: "qaCheck",
          foreignKey: "qa_checklist_id",
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        });
      }

      // Has Many
      PeeledDispatches.hasMany(models.Packing, {
        foreignKey: "peeled_dispatch_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  PeeledDispatches.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      peeled_dispatch_quantity: {
        type: DataTypes.FLOAT,
      },
      temperature: {
        type: DataTypes.FLOAT,
      },
      delivery_status: {
        type: DataTypes.STRING,
      },
      delivery_notes: {
        type: DataTypes.TEXT,
      },
      order_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment:
          "Reference to the sales order for which this peeled dispatch is made",
      },
      qa_checklist_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment:
          "Reference to QA Checklist (new position between PeelingProducts and PeeledDispatches)",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
      },
      created_at: {
        type: DataTypes.DATE,
      },
      updated_at: {
        type: DataTypes.DATE,
      },
      deleted_at: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "PeeledDispatches",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );

  // Create Hook
  PeeledDispatches.beforeCreate(async (data, options) => {
    try {
      // infer order_id from peeled_product/peeling chain if not provided
      if (!data.order_id && data.peeled_product_id) {
        const pp =
          await PeeledDispatches.sequelize.models.PeelingProducts.findOne({
            attributes: ["order_id"],
            where: { id: data.peeled_product_id, is_active: true },
            raw: true,
          });
        if (pp && pp.order_id) {
          data.order_id = pp.order_id;
        } else {
          // if product doesn't have order, try to look at parent dispatch via
          // peeling -> dispatch relationship
          const dispatchInfo =
            await PeeledDispatches.sequelize.models.Peeling.findOne({
              attributes: [],
              where: { id: pp?.peeling_id },
              include: [
                {
                  model: PeeledDispatches.sequelize.models.Dispatches,
                  attributes: ["order_id"],
                  as: "dis",
                  required: false,
                },
              ],
              raw: true,
              nest: true,
            });
          if (dispatchInfo && dispatchInfo.dis && dispatchInfo.dis.order_id) {
            data.order_id = dispatchInfo.dis.order_id;
          }
        }
      }
      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while appending an dispatch data",
        err?.message || err,
      );
    }
  });

  // Update Hook
  PeeledDispatches.beforeUpdate(async (data, options) => {
    try {
      data.updated_at = new Date();
      data.updated_by = options.profile_id;
    } catch (err) {
      console.log("Error while updating an dispatch data", err?.message || err);
    }
  });

  // Delete Hook
  PeeledDispatches.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting an dispatch data", err?.message || err);
    }
  });

  return PeeledDispatches;
};
