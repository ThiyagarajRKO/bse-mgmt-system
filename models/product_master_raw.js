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

      ProductMaster.belongsTo(models.SpeciesMaster, {
        foreignKey: "species_master_id",
        as: "Species",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      ProductMaster.belongsTo(models.DerivativeMaster, {
        foreignKey: "derivative_master_id",
        as: "Derivative",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      ProductMaster.belongsTo(models.SizeMaster, {
        foreignKey: "size_master_id",
        as: "Size",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      ProductMaster.belongsTo(models.GradeMaster, {
        foreignKey: "grade_master_id",
        as: "Grade",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      ProductMaster.belongsTo(models.GstMaster, {
        foreignKey: "gst_master_id",
        as: "GstConfig",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }

  ProductMaster.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      product_code: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false,
        comment: "System-generated SKU (e.g., SNP-WHL-RAW-1_2KG)",
      },
      product_name: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment:
          "Auto-generated name: {Species} – {Derivative} – {Grade} – {Size}",
      },
      species_master_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "species_master",
          key: "id",
        },
      },
      derivative_master_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "derivative_master",
          key: "id",
        },
        comment:
          'For RAW products: always "Whole"; For processed: Fillet, Loin, etc.',
      },
      grade_master_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "grade_master",
          key: "id",
        },
        comment: "NULL for RAW products; Grade A–D for processed",
      },
      size_master_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "size_master",
          key: "id",
        },
        comment:
          "Size must exist for RAW products; can be UNSIZED (for intake only)",
      },
      processing_state: {
        type: DataTypes.ENUM("RAW", "PROCESSED"),
        allowNull: false,
        defaultValue: "PROCESSED",
        comment: "RAW for unprocessed whole seafood; PROCESSED for derivatives",
      },
      product_role: {
        type: DataTypes.ENUM("RAW_MATERIAL", "WIP", "FINISHED_GOOD"),
        allowNull: false,
        defaultValue: "FINISHED_GOOD",
        comment:
          "Determines inventory ledger: Raw Material, WIP, or Finished Goods",
      },
      is_raw: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "True only if processing_state = RAW",
      },
      is_sellable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: "Can this product be sold to customers?",
      },
      is_producible: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: "Can this product be produced? (False for RAW materials)",
      },
      hsn_code: {
        type: DataTypes.STRING(10),
        allowNull: false,
        comment:
          "0302/0303 (Fish), 0306 (Crustacean), 0307 (Mollusc), 1605 (Cooked)",
      },
      gst_master_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "gst_master",
          key: "id",
        },
        comment: "Auto-assigned based on HSN code (5% domestic, 0% export)",
      },
      uom: {
        type: DataTypes.ENUM("KG", "PCS", "PACK"),
        allowNull: false,
        defaultValue: "KG",
        comment: "Unit of measure",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "user_profiles",
          key: "id",
        },
      },
      updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "user_profiles",
          key: "id",
        },
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
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
      timestamps: false,
      paranoid: false,
    }
  );

  // ============================================================================
  // HARD VALIDATION HOOKS FOR RAW PRODUCTS
  // ============================================================================

  /**
   * Before Create: Validate RAW product rules
   */
  ProductMaster.beforeCreate(async (product, options) => {
    if (product.processing_state === "RAW") {
      // RAW products MUST NOT have grade
      if (
        product.grade_master_id !== null &&
        product.grade_master_id !== undefined
      ) {
        throw new Error("RAW product cannot have a grade. Grade must be NULL.");
      }

      // RAW products MUST NOT be producible
      if (product.is_producible === true) {
        throw new Error(
          "RAW product cannot be producible (is_producible must be FALSE)."
        );
      }

      // RAW products MUST have size_id
      if (!product.size_master_id) {
        throw new Error(
          "RAW product must have a size_id (including UNSIZED bucket)."
        );
      }

      // Mark as raw
      product.is_raw = true;
      product.product_role = "RAW_MATERIAL";
    } else {
      // PROCESSED products MUST have derivative_id
      if (!product.derivative_master_id) {
        throw new Error(
          "PROCESSED product must reference a derivative_master_id."
        );
      }
    }

    // Ensure is_raw flag matches processing_state
    product.is_raw = product.processing_state === "RAW";
  });

  /**
   * Before Update: Prevent grade assignment to RAW
   */
  ProductMaster.beforeUpdate(async (product, options) => {
    if (product.processing_state === "RAW") {
      if (
        product.changed("grade_master_id") &&
        product.grade_master_id !== null
      ) {
        throw new Error(
          "Cannot assign grade to RAW product. Grade must remain NULL."
        );
      }

      if (product.changed("is_producible") && product.is_producible === true) {
        throw new Error(
          "Cannot mark RAW product as producible. RAW materials are consumed, not produced."
        );
      }
    }
  });

  /**
   * Format product name for RAW vs PROCESSED
   */
  ProductMaster.prototype.getFormattedName = function () {
    if (this.processing_state === "RAW") {
      return `${this.Species?.name} – Whole – Raw – ${
        this.Size?.display || "UNSIZED"
      }`;
    }
    // For processed: {Species} – {Derivative} – {Grade} – {Size}
    const parts = [
      this.Species?.name,
      this.Derivative?.name,
      this.Grade?.grade_name || "Ungraded",
      this.Size?.display,
    ];
    return parts.filter((p) => p).join(" – ");
  };

  return ProductMaster;
};
