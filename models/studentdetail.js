'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class StudentDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.User)
      this.belongsToMany(models.Course,{through:"StudentCourses"})
    }
  }
  StudentDetail.init({
    UserId: DataTypes.INTEGER,
    name: DataTypes.STRING,
    gender: DataTypes.STRING,
    bio: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'StudentDetail',
  });
  return StudentDetail;
};