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

      ProductMaster.belongsTo(models.SpeciesMaster, {
        foreignKey: "species_master_id",
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

      ProductMaster.belongsTo(models.DerivativeMaster, {
        foreignKey: "derivative_master_id",
        as: "Derivative",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      // 4D Mapping Association (Species × Derivative × Size × Grade)
      if (models.SpeciesDerivativeSizeGradeMapping) {
        ProductMaster.belongsTo(models.SpeciesDerivativeSizeGradeMapping, {
          foreignKey: "species_derivative_size_grade_mapping_id",
          as: "MappingProfile",
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        });
      }

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
      product_id: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false,
        comment: "System-generated SKU (e.g., SNP-WHL-RAW-1_2KG)",
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
      species_master_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "species_master",
          key: "id",
        },
        comment: "Direct species reference for raw products and quick lookups",
      },
      derivative_master_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "derivative_master",
          key: "id",
        },
        comment:
          "Foreign key reference to derivative_master. Defines processing level (Raw, Cooked, RTC, etc.)",
      },
      species_derivative_size_grade_mapping_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "species_derivative_size_grade_mapping",
          key: "id",
        },
        comment:
          "4D Mapping ID: Links to validated combination of species × derivative × size × grade. Ensures only valid combinations are used.",
      },
      processing_state: {
        type: DataTypes.ENUM("RAW", "PROCESSED"),
        allowNull: false,
        defaultValue: "PROCESSED",
        comment:
          "RAW = unprocessed whole seafood, PROCESSED = derivatives/cooked",
      },
      product_role: {
        type: DataTypes.ENUM("RAW_MATERIAL", "WIP", "FINISHED_GOOD"),
        allowNull: false,
        defaultValue: "FINISHED_GOOD",
        comment: "Accounting role: RAW_MATERIAL, WIP, or FINISHED_GOOD",
      },
      is_raw: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "True if processing_state = RAW (denormalized for queries)",
      },
      is_producible: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: "False for RAW (inputs), true for processed (can be produced)",
      },
      is_sellable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: "Whether product can be sold to customers",
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
    },
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
        err?.message || err,
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
            options?.where?.id,
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

  // RAW Product Validation Hook (ERP-grade enforcement)
  ProductMaster.beforeValidate((product) => {
    // Enforce RAW product rules
    if (product.processing_state === "RAW") {
      // RAW products cannot have grade
      if (
        product.grade_master_id !== null &&
        product.grade_master_id !== undefined
      ) {
        throw new Error(
          "RAW products cannot have grade. Only PROCESSED products can have grade.",
        );
      }

      // RAW products cannot be producible (they are inputs, not outputs)
      if (product.is_producible === true) {
        throw new Error(
          "RAW products cannot be producible (is_producible must be FALSE)",
        );
      }

      // RAW products must have size
      if (!product.size_master_id) {
        throw new Error(
          "RAW products must have a size (e.g., UNSIZED, 1-2kg, etc.)",
        );
      }

      // Sync is_raw flag
      product.is_raw = true;
    } else {
      // PROCESSED products
      product.is_raw = false;

      // PROCESSED products can have grade and be producible
      if (product.is_producible === undefined) {
        product.is_producible = true;
      }
    }
  });

  return ProductMaster;
};
