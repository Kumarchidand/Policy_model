const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
// Import your models here
const HrPolicy2 = require("../models/HRLeavePolicy");
const LeaveRequest = require("../models/LeaveRequest");
const Employee = require("../models/Employee");

router.post("/hr-policy2", async (req, res) => {
  try {
    const existing = await HrPolicy2.findOne();
    if (existing) {
      await HrPolicy2.updateOne({}, req.body);
      res.json({ message: "Policy updated successfully" });
    } else {
      await HrPolicy2.create(req.body);
      res.json({ message: "Policy created successfully" });
    }
  } catch (error) {
    console.error("Error saving policy:", error);
    res.status(500).json({ error: "Server error" });
  }
});
router.get("/hr-policy2", async (req, res) => {
  try {
    const policy = await HrPolicy2.findOne();
    res.json(policy || {});
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch policy" });
  }
});
router.post("/leaves", async (req, res) => {
  try {
    const { employeeId, leaveType, fromDate, toDate, reason } = req.body;
    // Parse dates
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (from > to) {
      return res
        .status(400)
        .json({ message: "'From Date' must be before or equal to 'To Date'" });
    }
    // Find employee
    const employee = await Employee.findById(employeeId);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    // Check for existing overlapping leaves with status Pending or Approved
    const overlappingLeave = await LeaveRequest.findOne({
      employeeId,
      status: { $in: ["Pending", "Approved"] }, // only these statuses block
      $or: [{ fromDate: { $lte: to }, toDate: { $gte: from } }],
    });
    if (overlappingLeave) {
      return res.status(400).json({
        message: `You already have a leave request from ${overlappingLeave.fromDate.toLocaleDateString()} to ${overlappingLeave.toDate.toLocaleDateString()} with status ${
          overlappingLeave.status
        }. Overlapping leave applications are not allowed.`,
      });
    }
    // Fetch HR policy document
    const polDoc = await HrPolicy2.findOne();
    if (!polDoc)
      return res.status(404).json({ message: "HR Policy not found" });

    // Match leave type in policy
    const typePolicy = polDoc.leaveTypes.find((lt) => lt.type === leaveType);
    if (!typePolicy)
      return res.status(400).json({ message: "Invalid leave type" });

    // Calculate total leave days
    const totalDays =
      Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Check max per request limit
    let errorMessage = "";
    if (totalDays > typePolicy.maxPerRequest) {
      errorMessage = `You can only apply for max ${typePolicy.maxPerRequest} days per request for ${leaveType}.`;
    }

    // Check total used leaves this year for leaveType
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const leaves = await LeaveRequest.find({
      employeeId,
      leaveType,
      status: "Approved",
      fromDate: { $gte: yearStart },
    });

    const totalUsed = leaves.reduce((sum, l) => sum + l.totalDays, 0);
    const remaining = typePolicy.normalDays - totalUsed;

    // Check over total yearly limit
    if (totalDays > remaining) {
      errorMessage = `You are requesting ${totalDays} days but only ${remaining} days left for ${leaveType}. Max allowed in a year: ${typePolicy.normalDays}`;
    }

    // Calculate Leave Without Pay (LWP) days if exceeding remaining
    let lwpDays = 0;
    if (totalDays > remaining) lwpDays = totalDays - remaining;

    // Save leave request without errorMessage, HR will decide
    const leaveRequest = new LeaveRequest({
      employeeId,
      employeeName: employee.name,
      leaveType,
      fromDate: from,
      toDate: to,
      totalDays,
      reason,
      lwpDays,
      mode: typePolicy.mode, // save mode from policy
      // message: "", // leave blank for HR input later
    });

    await leaveRequest.save();

    // Success response
    return res
      .status(201)
      .json({ message: "Leave applied successfully", leaveRequest });
  } catch (err) {
    console.error("Leave application error:", err);
    return res
      .status(500)
      .json({ message: "Leave application failed", error: err.message });
  }
});

router.get("/leaves/employee/:employeeId", async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({
      employeeId: req.params.employeeId,
    });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch leave data" });
  }
});

// change hela message pai

router.get("/leaves", async (req, res) => {
  try {
    const leaves = await LeaveRequest.find().populate("employeeId", "name");
    const hrPolicy = await HrPolicy2.findOne();

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    const leavesWithWarnings = await Promise.all(
      leaves.map(async (leave) => {
        const typePolicy = hrPolicy.leaveTypes.find(
          (lt) => lt.type === leave.leaveType
        );
        let eligibilityWarning = "";

        if (!typePolicy) {
          eligibilityWarning = "Invalid leave type";
        } else {
          if (leave.totalDays > typePolicy.maxPerRequest) {
            eligibilityWarning = `Max per request is ${typePolicy.maxPerRequest} days, requested ${leave.totalDays}`;
          }

          // Calculate total approved leaves of this type this year for employee, excluding current leave if approved
          const usedAnnualLeaves = await LeaveRequest.aggregate([
            {
              $match: {
                employeeId: leave.employeeId._id,
                leaveType: leave.leaveType,
                status: "Approved",
                fromDate: { $gte: yearStart },
              },
            },
            { $group: { _id: null, totalUsed: { $sum: "$totalDays" } } },
          ]);
          const totalUsed =
            (usedAnnualLeaves[0]?.totalUsed || 0) -
            (leave.status === "Approved" ? leave.totalDays : 0);
          const remaining = typePolicy.normalDays - totalUsed;

          if (leave.totalDays > remaining) {
            eligibilityWarning += eligibilityWarning ? "; " : "";
            eligibilityWarning += `Only ${remaining} days left this year, requested ${leave.totalDays}`;
          }
        }

        return {
          ...leave.toObject(),
          eligibilityWarning,
        };
      })
    );

    res.status(200).json(leavesWithWarnings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch leave requests" });
  }
});

// put
// avi change hua
router.put("/leaves/status/:id", async (req, res) => {
  const { status, message, fromDate, toDate } = req.body; // fromDate/toDate from HR modal (approval dates)
  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Not found" });

    leave.status = status;
    leave.message = message;

    // Update approved dates separately; original fromDate/toDate remain untouched
    if (fromDate && toDate) {
      leave.approvedFromDate = new Date(fromDate);
      leave.approvedToDate = new Date(toDate);

      // Recalculate approvedTotalDays
      leave.approvedTotalDays =
        Math.ceil(
          (new Date(toDate).getTime() - new Date(fromDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1;
    } else {
      // Agar HR ne approve kiya bina date specify kiye, toh approvedFromDate etc null kar sakte hain (optional)
      leave.approvedFromDate = null;
      leave.approvedToDate = null;
      leave.approvedTotalDays = 0;
    }

    await leave.save();
    res.json({ message: "Leave status updated." });
  } catch (err) {
    res.status(500).json({ message: "Failed to update", error: err.message });
  }
});

router.get("/leaves/balance/:employeeId", async (req, res) => {
  try {
    const employeeId = req.params.employeeId;

    // Fetch the leave policy
    const policy = await HrPolicy2.findOne();
    if (!policy) {
      return res.json({ categories: [] });
    }

    // Fetch all approved leaves for employee
    const leaves = await LeaveRequest.find({
      employeeId,
      status: "Approved",
    });

    // Calculate used leaves based on approvedTotalDays
    const categories = policy.leaveTypes.map((cat) => {
      const used = leaves
        .filter((lv) => lv.leaveType === cat.type)
        .reduce((sum, lv) => sum + (lv.approvedTotalDays || 0), 0);

      return {
        type: cat.type,
        totalAllowed: cat.normalDays,
        used,
        remaining: Math.max(cat.normalDays - used, 0),
        maxPerRequest: cat.maxPerRequest,
        frequency: cat.frequency, // from policy
        mode: cat.mode, // from policy
      };
    });

    res.json({ categories });
  } catch (error) {
    console.error("Error in /leaves/balance/:employeeId:", error);
    res.status(500).json({ error: "Failed to compute balances" });
  }
});

router.get("/leave/pending", async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ status: "Pending" })
      .sort({ requestedAt: -1 })
      .populate("employeeId", "name email");
    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch pending requests" });
  }
});

// ------------------count------------
// Example: GET /leaves/pending/count
router.get("/leaves/pending/count", async (req, res) => {
  try {
    const count = await LeaveRequest.countDocuments({ status: "Pending" });
    res.json({ pendingCount: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ pendingCount: 0 });
  }
});
// for emp
// PUT /leaves/mark-seen/:employeeId

router.put("/leaves/mark-seen/:employeeId", async (req, res) => {
  const employeeId = req.params.employeeId;

  try {
    await LeaveRequest.updateMany(
      {
        employeeId: mongoose.Types.ObjectId(employeeId),
        status: { $in: ["Approved", "Rejected"] },
        seenByEmployee: false,
      },
      {
        $set: { seenByEmployee: true },
      }
    );
    res.json({ message: "Leave requests marked as seen" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to mark as seen" });
  }
});

// GET /leaves/status/count/:employeeId
router.get("/leaves/status/count/:employeeId", async (req, res) => {
  const employeeId = req.params.employeeId;
  try {
    const count = await LeaveRequest.countDocuments({
      employeeId: mongoose.Types.ObjectId(employeeId),
      status: { $in: ["Approved", "Rejected"] },
      seenByEmployee: false,
    });
    res.json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ count: 0 });
  }
});
module.exports = router;
