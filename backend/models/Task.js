const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    employeeName: { type: String },
    taskName: { type: String },
    duration: { type: Number, required: true }, // in minutes
    rating: Number,
    finishedIn: Number,
    startedAt: Date, //manually lekhichi
    pausedAt: Date,
    finishedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
