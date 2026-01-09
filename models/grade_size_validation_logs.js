'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GradeSizeValidationLog = sequelize.define('grade_size_validation_logs', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    production_order_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    species_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    derivative_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    measured_size_kg: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: false,
      comment: 'Actual measured size from scale'
    },
    mapped_size_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'Mapped to size_master entry based on measured_size_kg'
    },
    declared_grade: {
      type: DataTypes.ENUM('A', 'B', 'C', 'D'),
      allowNull: false,
      comment: 'Grade declared at raw issue time'
    },
    validation_status: {
      type: DataTypes.ENUM('VALID', 'INVALID', 'BLOCKED'),
      defaultValue: 'VALID',
      comment: 'VALID: combination allowed | INVALID: not in business rules | BLOCKED: hard block (e.g., whole Grade D)'
    },
    validation_reason: {
      type: DataTypes.TEXT,
      comment: 'Business rule that triggered this status or failure reason'
    },
    size_locked_at: {
      type: DataTypes.DATE,
      comment: 'Timestamp when size was locked (immutable from this point)'
    },
    grade_locked_at: {
      type: DataTypes.DATE,
      comment: 'Timestamp when grade was locked (immutable from this point)'
    },
    validated_by: DataTypes.UUID,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, {
    tableName: 'grade_size_validation_logs',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['production_order_id']
      },
      {
        fields: ['species_id', 'derivative_id']
      },
      {
        fields: ['validation_status']
      }
    ]
  });

  GradeSizeValidationLog.associate = (models) => {
    GradeSizeValidationLog.belongsTo(models.production_orders, {
      foreignKey: 'production_order_id',
      as: 'production_order'
    });
    GradeSizeValidationLog.belongsTo(models.species_master, {
      foreignKey: 'species_id',
      as: 'species'
    });
    GradeSizeValidationLog.belongsTo(models.derivative_master, {
      foreignKey: 'derivative_id',
      as: 'derivative'
    });
  };

  return GradeSizeValidationLog;
};
