const mongoose = require("mongoose");

const LeaveRequestSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    employeeName: { type: String, required: true },
    leaveType: {
      type: String,
      required: true,
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
    totalDays: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    message: {
      type: String,
      default: "",
    },
    mode: {
      type: String,
    },
    lwpDays: {
      type: Number,
      default: 0,
    },
    seenByEmployee: { type: Boolean, default: false },

    // New fields for HR approval (optional, lekin recommended)
    approvedFromDate: Date, // HR approved start date
    approvedToDate: Date, // HR approved end date
    approvedTotalDays: Number, // HR approved days count
  },
  { timestamps: true }
);

module.exports = mongoose.model("LeaveRequest", LeaveRequestSchema);
