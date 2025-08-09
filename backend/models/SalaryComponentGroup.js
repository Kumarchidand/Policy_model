const mongoose = require('mongoose');

const SalaryComponentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['earning', 'deduction'],
    required: true
  }
});

const SalaryComponentGroupSchema = new mongoose.Schema({
  components: [SalaryComponentSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SalaryComponentGroup', SalaryComponentGroupSchema);
