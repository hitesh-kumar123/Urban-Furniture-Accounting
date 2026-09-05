const mongoose = require('mongoose');

const salaryStructureSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Salary Structure name is required'],
      trim: true,
      unique: true
    },
    code: {
      type: String,
      required: [true, 'Salary Structure code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    rules: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalaryRule',
        required: true
      }
    ],
    active: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

const SalaryStructure = mongoose.model('SalaryStructure', salaryStructureSchema);

module.exports = SalaryStructure;
