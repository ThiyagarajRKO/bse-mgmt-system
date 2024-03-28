"use strict";
const { Model } = require("sequelize");
const { Op } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ProductMaster extends Model {
    static associate(models) {
      ProductMaster.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      ProductMaster.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      ProductMaster.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      ProductMaster.belongsTo(models.SpeciesMaster, {
        foreignKey: "species_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  ProductMaster.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      product_name: {
        type: DataTypes.STRING,
      },
      product_short_code: {
        type: DataTypes.STRING,
      },
      product_code: {
        type: DataTypes.TEXT,
      },
      size_master_ids: {
        type: DataTypes.ARRAY(DataTypes.UUID),
      },
      size_master_sizes: {
        type: DataTypes.ARRAY(DataTypes.STRING),
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
      modelName: "ProductMaster",
      tableName: "product_master",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  // Create Hook
  ProductMaster.beforeCreate(async (data, options) => {
    try {
      const { species_name } = await sequelize.models.SpeciesMaster.findOne({
        attribute: "species_name",
        where: { id: data?.species_master_id, is_active: true },
      });

      data.product_code = `${species_name
        ?.trim()
        ?.replaceAll(" ", "")
        ?.toUpperCase()}-${data.product_name
        ?.trim()
        ?.replaceAll(" ", "")
        ?.toUpperCase()}`;

      const size_master = await sequelize.models.SizeMaster.findAll({
        attribute: "size",
        where: {
          id: { [Op.in]: data?.size_master_ids },
          is_active: true,
        },
      });

      let Sizes = [];
      size_master.forEach(({ size }) => Sizes.push(size));

      data.size_master_sizes = Sizes;

      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while inserting a vendor details",
        err?.message || err
      );
    }
  });

  // Update Hook
  ProductMaster.beforeUpdate(async (data, options) => {
    try {
      const { species_name } = await sequelize.models.SpeciesMaster.findOne({
        attribute: "species_name",
        where: { id: data?.species_master_id, is_active: true },
      });

      data.product_code = `${species_name
        ?.trim()
        ?.replaceAll(" ", "")
        ?.toUpperCase()}-${data.product_name
        ?.trim()
        ?.replaceAll(" ", "")
        ?.toUpperCase()}`;

      const size_master = await sequelize.models.SizeMaster.findAll({
        attribute: "size",
        where: {
          id: { [Op.in]: data?.size_master_ids },
          is_active: true,
        },
      });

      let Sizes = [];
      size_master.forEach(({ size }) => Sizes.push(size));

      data.size_master_sizes = Sizes;

      data.updated_at = new Date();
      data.updated_by = options?.profile_id;
    } catch (err) {
      console.log("Error while updating a vendor", err?.message || err);
    }
  });

  // Delete Hook
  ProductMaster.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting a vendor", err?.message || err);
    }
  });

  return ProductMaster;
};
