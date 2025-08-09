const mongoose = require("mongoose");

const slipSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  employeeName: {
    type: String,
    required: true,
  },
  designation: String,
  totalWorkingDays: Number,
  presentDays: Number,
  paidLeaves: Number,
  unpaidLeaves: Number,
  grossSalary: Number,
  deductionAmount: Number,
  netSalary: Number,
  status: {
    type: String,
    enum: ["success", "failed"],
    default: "success",
  },
  errorMessage: String,
});

const monthlySalarySlipSchema = new mongoose.Schema(
  {
    month: {
      type: String,
      required: true,
      enum: [
        "01",
        "02",
        "03",
        "04",
        "05",
        "06",
        "07",
        "08",
        "09",
        "10",
        "11",
        "12",
      ],
    },
    year: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^\d{4}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid year!`,
      },
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    slips: [slipSchema],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Ensure one doc per month-year combo
monthlySalarySlipSchema.index({ month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("SalarySlip", monthlySalarySlipSchema);
