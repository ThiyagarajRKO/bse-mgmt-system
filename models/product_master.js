"use strict";
const { Model } = require("sequelize");

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

      ProductMaster.belongsTo(models.ProductCategoryMaster, {
        foreignKey: "product_category_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      ProductMaster.belongsTo(models.SizeMaster, {
        foreignKey: "size_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      ProductMaster.belongsTo(models.GradeMaster, {
        foreignKey: "grade_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      // Has One
      ProductMaster.hasOne(models.ProcurementProducts, {
        foreignKey: "product_master_id",
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
        type: DataTypes.TEXT,
      },
      hsn_code: {
        type: DataTypes.STRING(10),
        allowNull: true,
        comment:
          "HSN (Harmonized System of Nomenclature) code for GST classification",
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
      const product_category =
        await sequelize.models.ProductCategoryMaster.findOne({
          required: true,
          attribute: "product_category",
          include: [
            {
              required: true,
              attribute: "species_name",
              model: sequelize.models.SpeciesMaster,
              where: {
                is_active: true,
              },
            },
          ],
          where: { id: data?.product_category_master_id, is_active: true },
        });

      // Generate product_name: SPECIES_NAME-PRODUCT_CATEGORY-GRADE-SIZE
      data.product_name = `${product_category?.SpeciesMaster?.species_name
        ?.trim()
        ?.replaceAll(" ", "")
        ?.toUpperCase()}-${product_category.product_category
        ?.trim()
        ?.replaceAll(" ", "")
        ?.toUpperCase()}`;

      if (data?.grade_master_id) {
        const gradeRecord = await sequelize.models.GradeMaster.findOne({
          attributes: ["grade_name"],
          where: { id: data?.grade_master_id, is_active: true },
        });
        const gradeName =
          gradeRecord?.dataValues?.grade_name || gradeRecord?.grade_name;
        if (gradeName) {
          data.product_name += `-${gradeName
            ?.trim()
            ?.replaceAll(" ", "")
            ?.toUpperCase()}`;
        }
      }

      if (data?.size_master_id) {
        const sizeRecord = await sequelize.models.SizeMaster.findOne({
          attributes: ["size"],
          where: { id: data?.size_master_id, is_active: true },
        });
        const sizeValue = sizeRecord?.dataValues?.size || sizeRecord?.size;
        if (sizeValue) {
          data.product_name += `-${sizeValue
            ?.trim()
            ?.replaceAll(" ", "")
            ?.toUpperCase()}`;
        }
      }

      data.created_by = options.profile_id;

      // Map HSN code from species if not provided
      if (!data.hsn_code) {
        const speciesHsnCode = product_category?.SpeciesMaster?.hsn_code;
        if (speciesHsnCode) {
          data.hsn_code = speciesHsnCode;
        }
      }
    } catch (err) {
      console.log(
        "Error while inserting a product master details",
        err?.message || err
      );
    }
  });

  // Update Hook
  ProductMaster.beforeUpdate(async (data, options) => {
    try {
      // For updates, only regenerate product_name if category, grade, or size is being changed
      const shouldRegenerateName =
        data?.product_category_master_id ||
        data?.grade_master_id ||
        data?.size_master_id;

      if (shouldRegenerateName) {
        // If category is not being updated, fetch it from the current product
        let categoryMasterId = data?.product_category_master_id;
        let gradeData = null;
        let sizeData = null;

        if (!categoryMasterId && options?.where?.id) {
          // Fetch existing product to get current category
          const existingProduct = await ProductMaster.findByPk(
            options?.where?.id
          );
          categoryMasterId = existingProduct?.product_category_master_id;
        }

        if (categoryMasterId) {
          const product_category =
            await sequelize.models.ProductCategoryMaster.findOne({
              required: true,
              attributes: ["product_category"],
              include: [
                {
                  required: true,
                  attributes: ["species_name"],
                  model: sequelize.models.SpeciesMaster,
                  where: {
                    is_active: true,
                  },
                },
              ],
              where: { id: categoryMasterId, is_active: true },
            });

          if (product_category) {
            const baseName = `${product_category?.SpeciesMaster?.species_name
              ?.trim()
              ?.replaceAll(" ", "")
              ?.toUpperCase()}-${product_category.product_category
              ?.trim()
              ?.replaceAll(" ", "")
              ?.toUpperCase()}`;

            data.product_name = baseName;

            // Add grade if provided or if it's already set
            if (data?.grade_master_id) {
              const gradeRecord = await sequelize.models.GradeMaster.findOne({
                attributes: ["grade_name"],
                where: { id: data?.grade_master_id, is_active: true },
              });

              const gradeValue =
                gradeRecord?.dataValues?.grade_name || gradeRecord?.grade_name;

              if (gradeRecord && gradeValue) {
                data.product_name += `-${gradeValue
                  ?.trim()
                  ?.replaceAll(" ", "")
                  ?.toUpperCase()}`;
              }
            }

            // Add size if provided or if it's already set
            if (data?.size_master_id) {
              const sizeRecord = await sequelize.models.SizeMaster.findOne({
                attributes: ["size"],
                where: { id: data?.size_master_id, is_active: true },
              });

              const sizeValue =
                sizeRecord?.dataValues?.size || sizeRecord?.size;

              if (sizeRecord && sizeValue) {
                data.product_name += `-${sizeValue
                  ?.trim()
                  ?.replaceAll(" ", "")
                  ?.toUpperCase()}`;
              }
            }
          }
        }
      }

      // Map HSN code from species if category is being updated
      if (data?.product_category_master_id && !data.hsn_code) {
        const product_category =
          await sequelize.models.ProductCategoryMaster.findOne({
            required: true,
            attributes: ["product_category"],
            include: [
              {
                required: true,
                attributes: ["species_name", "hsn_code"],
                model: sequelize.models.SpeciesMaster,
                where: {
                  is_active: true,
                },
              },
            ],
            where: { id: data.product_category_master_id, is_active: true },
          });

        if (product_category?.SpeciesMaster?.hsn_code) {
          data.hsn_code = product_category.SpeciesMaster.hsn_code;
        }
      }

      data.updated_at = new Date();
      data.updated_by = options?.profile_id;
    } catch (err) {
      console.log("Error while updating a product master", err?.message || err);
    }
  });

  // Delete Hook
  ProductMaster.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting a product master", err?.message || err);
    }
  });

  return ProductMaster;
};
