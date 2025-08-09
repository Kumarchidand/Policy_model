const mongoose = require('mongoose');

const SalaryComponentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['flat', 'percentage'],
    required: true
  },
  value: {
    type: Number,
    required: function() {
      return this.type === 'flat';
    }
  },
  percent: {
    type: Number,
    required: function() {
      return this.type === 'percentage';
    }
  },
  amount: {
    type: Number,
    required: true
  },
  base: {
    type: [String],
    default: []
  },
  category: {
    type: String,
    enum: ['earning', 'deduction'],
    required: true
  }
});

const EmployeeSalarySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',  // yeh link karega Employee collection se
    required: true,
  },
  month: { type: String, required: true},
  year: { type: Number, required: true },
  components: [SalaryComponentSchema],  // salary components jese basic, allowances etc.
  basicSalary: { type: Number, required: true },
  grossSalary: { type: Number, required: true },
  netSalary: { type: Number, required: true },
  status: { type: String, enum: ['draft', 'approved', 'paid', 'cancelled'], default: 'draft' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});


// Make unique index on employee, month, year composite keys
// EmployeeSalarySchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });


module.exports = mongoose.model('EmployeeSalary', EmployeeSalarySchema);