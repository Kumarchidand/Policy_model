const mongoose = require("mongoose");

const leaveTypeSchema = new mongoose.Schema({
  type: { type: String, required: true },
  mode: { type: String, enum: ["Free", "Paid"], default: "Free" },
  frequency: { type: String, enum: ["Monthly", "Yearly"], default: "Monthly" },
  maxPerRequest: { type: Number, required: true }, //days per request at a time
  normalDays: { type: Number, required: true }, //yearly
  allowedAfterLimit: { type: Boolean, default: false }, // naya flag
});

const hrLeaveSchema = new mongoose.Schema(
  {
    leaveTypes: [leaveTypeSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("HRLeavePolicy", hrLeaveSchema);

// eg:
//  {
//   "leaveTypes": [
//     {
//       "type": "EL",
//       "mode": "Paid",
//       "frequency": "Yearly",
//       "maxPerRequest": 5,
//       "normalDays": 20
//     },
//    c
//   ]
// }
