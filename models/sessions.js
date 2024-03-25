"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Sessions extends Model {
    static associate(models) {}
  }
  Sessions.init(
    {
      sid: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      expires: {
        type: DataTypes.DATE,
      },
      data: {
        type: DataTypes.TEXT,
      },
      createdAt: {
        type: DataTypes.DATE,
      },
      updatedAt: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "Sessions",
      underscored: true,
      // createdAt: false,
      // updatedAt: false,
    }
  );

  return Sessions;
};
