"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PeelingProducts extends Model {
    static associate(models) {
      PeelingProducts.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PeelingProducts.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PeelingProducts.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PeelingProducts.belongsTo(models.Peeling, {
        as: "pln",
        foreignKey: "peeling_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PeelingProducts.belongsTo(models.ProductMaster, {
        foreignKey: "product_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      // Has Many
      PeelingProducts.hasMany(models.QAChecklist, {
        foreignKey: "peeled_product_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PeelingProducts.hasMany(models.PeeledDispatches, {
        foreignKey: "peeled_product_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  PeelingProducts.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      yield_quantity: {
        type: DataTypes.FLOAT,
      },
      peeling_status: {
        type: DataTypes.STRING,
        defaultValue: "In Progress",
      },
      peeling_notes: {
        type: DataTypes.TEXT,
      },
      order_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment:
          "Denormalised reference to the sales order for this peeled product",
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
      modelName: "PeelingProducts",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );

  // Bulk Create Hook
  PeelingProducts.beforeBulkCreate(async (data, options) => {
    try {
      data?.map((item) => {
        item.peeling_status = item.yield_quantity ? "Completed" : "In Progress";

        item.is_active = true;

        item.created_by = options?.profile_id;
      });
      // infer order_id from parent peeling if not already provided
      data?.map((item) => {
        if (!item.order_id && item.peeling_id) {
          // we intentionally do _not_ await inside map; we'll fetch below
        }
      });

      // second pass to fill order_id once we know which peeling_ids are needed
      const peelingIds = [
        ...new Set(data.map((i) => i.peeling_id).filter(Boolean)),
      ];
      if (peelingIds.length) {
        const peelings = await sequelize.models.Peeling.findAll({
          attributes: ["id", "order_id"],
          where: { id: peelingIds },
          raw: true,
        });
        const orderMap = peelings.reduce((m, p) => {
          m[p.id] = p.order_id;
          return m;
        }, {});
        data.forEach((item) => {
          if (!item.order_id && item.peeling_id) {
            item.order_id = orderMap[item.peeling_id] || null;
          }
        });
      }
    } catch (err) {
      console.log(
        "Error while appending an peeling products data",
        err?.message || err,
      );
    }
  });

  // Create Hook
  PeelingProducts.beforeCreate(async (data, options) => {
    try {
      data.peeling_status = data.yield_quantity ? "Completed" : "In Progress";
      data.is_active = true;

      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while appending an peeling products data",
        err?.message || err,
      );
    }
    if (!data.order_id && data.peeling_id) {
      const p = await sequelize.models.Peeling.findOne({
        attributes: ["order_id"],
        where: { id: data.peeling_id },
        raw: true,
      });
      if (p) data.order_id = p.order_id;
    }
  });

  // Update Hook
  PeelingProducts.beforeUpdate(async (data, options) => {
    try {
      data.updated_at = new Date();
      data.updated_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while updating an peeling products data",
        err?.message || err,
      );
    }
  });

  // Delete Hook
  PeelingProducts.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log(
        "Error while deleting an peeling products data",
        err?.message || err,
      );
    }
  });

  return PeelingProducts;
};
