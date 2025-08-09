const mongoose = require("mongoose");

const salaryIncrementSchema = new mongoose.Schema({
  name: String,
  date_of_joining: Date,
  current_salary: Number,
  performance_rating: Number,
  total_fine_deductions: { type: Number, default: 0 },
  deductions: [
    {
      date: Date,
      amount: Number,
      reason: String,
      leaveId: mongoose.Schema.Types.ObjectId,
    },
  ],
});
module.exports = mongoose.model("SalaryIncrement", salaryIncrementSchema);
