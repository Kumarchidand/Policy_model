const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Permission = require("./models/Permission");
const HrPolicy = require("./models/HRPolicy");
const SalaryIncrement = require("./models/SalaryIncrement");
const Employee = require("./models/Employee");
const Task = require("./models/Task");
const LeaveRequest = require("./models/LeaveRequest");
const HrPolicy2 = require("./models/HRLeavePolicy");
const LeaveRoute = require("./routes/LeaveRoute");
const LoginRoute = require("./routes/LoginRoute");
const EmployeeAllRoute = require("./routes/EmployeeAllRoute");
const TaskRoute = require("./routes/TaskRoute");
const attendanceRoutes = require("./routes/attendanceRoutes");
const Attendance = require("./models/Attendance");
const SalarySlipRoute = require("./routes/SalarySlipRoute");
const SalaryComponentGroup = require("./models/SalaryComponentGroup");
const EmployeeSalary = require("./models/EmployeeSalary");

require("dotenv").config();
const cookieParser = require("cookie-parser");
const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true, //allow sending coolie
  })
);
app.use(express.json());
app.use(cookieParser());

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/employeeDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("MongoDB connected for attandance");

    try {
      const attendanceCount = await Attendance.countDocuments();

      if (attendanceCount === 0) {
        await Attendance.insertMany(data);
        console.log("Dummy attendance data added successfully");
      } else {
        console.log("Attendance data already exists, skipping insertion");
      }
    } catch (err) {
      console.error("Error seeding attendance data:", err);
    }
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

mongoose.connection.once("open", async () => {
  console.log("MongoDB connected");
  const existing = await HrPolicy.find();
  if (existing.length === 0) {
    await HrPolicy.create({
      title: "Annual Performance-Based Increments",
      eligibility: [
        "Employees who have completed 12 months of service as of the appraisal cut-off date.",
        "No increment during probation period, unless mentioned in offer letter.",
      ],
      appraisal_process: [
        "Self-Appraisal Submission",
        "Manager Review",
        "HR Calibration and Review",
        "Final Approval by Management",
      ],
      criteria: [
        { rating: "5", label: "Outstanding", increment_range: "10% - 15%" },
        {
          rating: "4",
          label: "Exceeds Expectations",
          increment_range: "5% - 10%",
        },
        {
          rating: "3",
          label: "Meets Expectations",
          increment_range: "3% - 5%",
        },
        { rating: "2", label: "Average", increment_range: "2% - 3%" },
        { rating: "1", label: "General", increment_range: "1%" },
      ],
      special_increments: [
        {
          milestone: "5-Year Completion",
          details: [
            "One-time 10%-15% increment after 5 years",
            "Performance must be Meets Expectations or higher",
            "Effective after 5 years of service",
          ],
        },
        {
          milestone: "10-Year Milestone",
          details: [
            "One-time 15%-25% increment",
            "Given in recognition of long-term contribution",
            "May be accompanied by certificate/award",
          ],
        },
        {
          milestone: "15-Year Milestone",
          details: [
            "One-time 30%-45% increment",
            "Given in recognition of long-term contribution",
            "May be accompanied by certificate/award",
          ],
        },
      ],
    });
  }
});

app.use("/", LeaveRoute);
app.use("/", LoginRoute);
app.use("/", EmployeeAllRoute);
app.use("/", TaskRoute);

app.use("/api", attendanceRoutes);
app.use("/", SalarySlipRoute);

// salary componets

// Save multiple components
//e jo salary individual employee se save hora he wo wala field

app.post('/salary-components-assigned/:employeeId', async (req, res) => {
  const { employeeId } = req.params;
  const { components, basicSalary, grossSalary, netSalary } = req.body;

  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ error: 'Invalid employee ID' });
    }

    // Validate fields
    if (!Array.isArray(components)) {
      return res.status(400).json({ error: 'Components should be an array' });
    }
    if (
      typeof basicSalary !== 'number' ||
      typeof grossSalary !== 'number' ||
      typeof netSalary !== 'number'
    ) {
      return res.status(400).json({ error: 'Salary fields must be numbers' });
    }

    // Check employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Get current month and year
    const now = new Date();
    const month = now.toLocaleString('default', { month: 'long' });
    const year = now.getFullYear();

    // Transform components (use comp.value as percent for percentage type)
    const transformedComponents = components.map(comp => ({
      name: comp.name,
      type: comp.type,
      value: comp.type === 'flat' ? comp.value : undefined,
      percent: comp.type === 'percentage' ? comp.value : undefined,
      amount: comp.amount,
      base: comp.base || [],
      category: comp.isDeduction ? 'deduction' : 'earning',
    }));

    // Upsert record
    const updated = await EmployeeSalary.findOneAndUpdate(
      { employee: employeeId, month, year },       // Filter by employee, month, year
      {
        employee: employeeId,
        month,
        year,
        components: transformedComponents,
        basicSalary,
        grossSalary,
        netSalary,
        updatedAt: Date.now(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({
      message: 'Salary components saved successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error saving salary components:', error);
    return res.status(500).json({
      error: 'Failed to save salary components',
      details: error.message,
    });
  }
});

app.get('/salary-components-assigned/:employeeId', async (req, res) => {
  const { employeeId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ error: 'Invalid employee ID' });
    }

    // Find latest record OR you can find all based on your requirement
    const record = await EmployeeSalary.findOne({ employee: employeeId })
      .sort({ year: -1, month: -1 }); // latest first

    if (!record) {
      // No salary record found for employee, send empty response or empty object
      return res.json({ components: [] });
    }

    return res.json(record);
  } catch (error) {
    console.error('Error fetching salary components:', error);
    return res.status(500).json({ error: 'Failed to fetch salary records' });
  }
});


app.post("/salary-components", async (req, res) => {
  try {
    // expects req.body to be an array of components
    const group = new SalaryComponentGroup({
      components: req.body,
    });
    await group.save();
    res.status(201).json({ message: "Components saved successfully!" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/salary-components", async (req, res) => {
  const data = await SalaryComponentGroup.findOne().lean(); // get first (or by user)
  if (!data) return res.json({ components: [] });
  res.json(data);
});

app.get("/generate-salary-slip", async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;
    const monthIndex = new Date(`${month} 1, ${year}`).getMonth();

    // Fetch employee
    const employee = await Employee.findById(employeeId);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    // Total working days in the requested month
    const totalWorkingDays = new Date(year, monthIndex + 1, 0).getDate();

    // Fetch HR policy (latest)
    const policy = await HrPolicy2.findOne();
    if (!policy)
      return res.status(400).json({ message: "HR Leave policy not found" });

    // Initialize leave counts dynamically for all leave types
    const leaveCount = {};
    for (const lt of policy.leaveTypes) {
      leaveCount[lt.type] = 0;
    }

    // Fetch all approved leaves for the employee in that month
    const allLeaves = await LeaveRequest.find({
      employeeId,
      status: "Approved",
      approvedFromDate: {
        $gte: new Date(year, monthIndex, 1),
        $lte: new Date(year, monthIndex + 1, 0),
      },
    });

    // Calculate leaves considering yearly allowance and categorize paid/unpaid
    for (const leave of allLeaves) {
      const type = leave.leaveType;
      const days = leave.approvedTotalDays || 0;

      const policyEntry = policy.leaveTypes.find((p) => p.type === type);
      if (!policyEntry) continue; // Ignore unknown leave types

      // Calculate total used days in year including this leave
      const yearStart = new Date(year, 0, 1);
      const usedThisYearAgg = await LeaveRequest.aggregate([
        {
          $match: {
            employeeId: leave.employeeId,
            leaveType: type,
            status: "Approved",
            fromDate: {
              $gte: yearStart,
              $lte: new Date(year, monthIndex + 1, 0),
            },
          },
        },
        { $group: { _id: null, total: { $sum: "$approvedTotalDays" } } },
      ]);
      const totalUsed = usedThisYearAgg[0]?.total || 0;
      const allowed = policyEntry.normalDays;

      // Remaining allowed days this year for this leaveType
      const remainingAllowed = Math.max(allowed - totalUsed, 0);

      // Leave days counted as paid/unpaid split if exceeding allowed days
      const paidLeaveDays = Math.min(days, remainingAllowed);
      const unpaidLeaveDays = days - paidLeaveDays;

      // Add paid leave days to leaveCount
      if (paidLeaveDays > 0) {
        leaveCount[type] += paidLeaveDays;
      }

      // Excess days beyond allowed considered unpaid leave
      if (unpaidLeaveDays > 0) {
        // Use a special key for unpaid excess leaves or accumulate to unpaidLeaveType if exists
        // We'll accumulate excess unpaid leaves to a virtual "UNPAID_EXCESS" key

        leaveCount["UNPAID_EXCESS"] =
          (leaveCount["UNPAID_EXCESS"] || 0) + unpaidLeaveDays;
      }
    }

    // Now classify total leaves into paidLeaves and unpaidLeaves based on leave mode in policy

    let paidLeaves = 0;
    let unpaidLeaves = 0;

    for (const lt of policy.leaveTypes) {
      const count = leaveCount[lt.type] || 0;
      if (lt.mode === "Paid") {
        paidLeaves += count;
      } else if (lt.mode === "Unpaid" || "Free") {
        unpaidLeaves += count;
      } else {
        // If mode undefined or invalid, treat as unpaid by default (safety net)
        unpaidLeaves += count;
      }
    }

    // Include unpaid excess leaves in unpaidLeaves count
    unpaidLeaves += leaveCount["UNPAID_EXCESS"] || 0;

    // Calculate present days and salary deduction
    const totalLeavesTaken = paidLeaves + unpaidLeaves;
    const presentDays = totalWorkingDays - totalLeavesTaken;

    const perDaySalary = employee.salary / totalWorkingDays;
    const deductionAmount = unpaidLeaves * perDaySalary;
    const netSalary = employee.salary - deductionAmount;

    // Response JSON
    res.json({
      employeeName: employee.name,
      employeeId: employee._id,
      designation: employee.designation || "Employee",
      month,
      year,
      totalWorkingDays,
      presentDays,
      paidLeaves,
      unpaidLeaves,
      grossSalary: employee.salary,
      deductionAmount: Math.round(deductionAmount),
      netSalary: Math.round(netSalary),
      leavesBreakup: leaveCount, // Show detailed leave counts to user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/forget", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "missing fileds" });
  const hash = await bcrypt.hash(password, 10);
  const user = await User.findOneAndUpdate({ email }, { password: hash });
  if (!user) return res.status(404).json({ error: "Users not found" });
  res.json({ message: "Password Updated" });
});

// Create or update permissions
app.post("/permissions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { operations } = req.body;

    let perm = await Permission.findOne({ userId });
    if (!perm) {
      perm = new Permission({ userId, operations });
    } else {
      perm.operations = operations;
    }
    await perm.save();
    res.status(200).json({ message: "Permissions updated", perm });
  } catch (err) {
    res.status(500).json({ error: "Error saving permissions" });
  }
});

// Get user permissions
app.get("/permissions/:userId", async (req, res) => {
  try {
    let userId = req.params.userId;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userId = new mongoose.Types.ObjectId(userId);
    }
    const perm = await Permission.findOne({ userId });
    if (!perm) return res.status(404).json({ error: "No permissions found" });
    res.status(200).json(perm);
  } catch (err) {
    res.status(500).json({ error: "Error fetching permissions" });
  }
});

app.get("/api/special-increments", async (req, res) => {
  try {
    const employees = await Employee.find();
    const [policy] = await HrPolicy.find();
    // it return the first object
    const today = new Date();

    // Extract milestone years from special_increments in HR policy
    const milestones = policy.special_increments
      .map((item) => {
        const yearMatch = item.milestone.match(/(\d+)-Year/); // e.g. "10-Year Milestone"
        return yearMatch ? parseInt(yearMatch[1]) : null;
      })
      .filter(Boolean); // remove nulls

    const eligible = employees
      .map((emp) => {
        const doj = new Date(emp.date_of_joining);
        // aagar aniveray nahi he to -1 ,nahi to -0
        const years =
          today.getFullYear() -
          doj.getFullYear() -
          (today.getMonth() < doj.getMonth() ||
          (today.getMonth() === doj.getMonth() &&
            today.getDate() < doj.getDate())
            ? 1
            : 0);

        // Find highest eligible milestone
        let matchedMilestone = null;
        let maxYears = 0;
        policy.special_increments.forEach((item) => {
          const match = item.milestone.match(/(\d+)-Year/);
          // match = ["10-Year", "10"];
          // milestoneYears = 10;
          if (match) {
            const milestoneYears = parseInt(match[1]);
            if (years >= milestoneYears && milestoneYears > maxYears) {
              matchedMilestone = item;
              maxYears = milestoneYears;
            }
          }
        });
        if (matchedMilestone) {
          return {
            name: emp.name,
            date_of_joining: emp.date_of_joining,
            years: years,
            milestone: matchedMilestone.milestone,
          };
        }
        return null;
      })
      .filter(Boolean);
    res.status(200).json(eligible);
  } catch (err) {
    console.error("Error fetching special increment eligible employees", err);
    res.status(500).json({ error: "Server error" });
  }
});
// salary change
app.get("/api/salary-increments", async (req, res) => {
  try {
    const tasks = await Task.find();
    const employees = await Employee.find();
    const [policy] = await HrPolicy.find();

    if (!policy || !policy.criteria) {
      return res.status(500).json({ error: "HR Policy criteria missing." });
    }

    const ratingCriteria = policy.criteria;

    // Get all salary increments with fines
    const salaryData = await SalaryIncrement.find();

    const result = employees.map((emp) => {
      const doj = new Date(emp.date_of_joining);
      const today = new Date();
      const experience = Math.floor(
        (today - doj) / (1000 * 60 * 60 * 24 * 365)
      );

      const ratings = tasks
        .filter((t) => t.employeeName === emp.name)
        .map((t) => t.rating);
      const avgRating = ratings.length
        ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length)
        : 1;

      const ratingInfo = ratingCriteria.find(
        (c) => parseInt(c.rating) === avgRating
      );
      const label = ratingInfo?.label || "General";
      const incrementRange = ratingInfo?.increment_range || "1%";
      const basePercent = parseInt(incrementRange.split("-")[0]) || 1;

      // Calculate experience-based special increment
      let specialIncrement = 0;
      let level = "Fresher";
      if (experience >= 2 && experience < 5) level = "Mid-Level";
      else if (experience >= 5) level = "Expert";

      if (experience >= 15) specialIncrement = 45;
      else if (experience >= 10) specialIncrement = 25;
      else if (experience >= 5 && avgRating >= 3) specialIncrement = 15;

      // Get fine deductions from salary data
      const empSalaryData = salaryData.find((s) => s.name === emp.name);
      const totalFines = empSalaryData?.total_fine_deductions || 0;
      const deductions = empSalaryData?.deductions || [];

      const totalIncrement = basePercent + specialIncrement;
      const grossNewSalary = Math.round(
        emp.salary * (1 + totalIncrement / 100)
      );
      const netNewSalary = grossNewSalary - totalFines;

      return {
        name: emp.name,
        level,
        experience,
        current_salary: emp.salary,
        avg_rating: avgRating,
        rating_label: label,
        base_increment: basePercent,
        special_increment: specialIncrement,
        total_increment: totalIncrement,
        gross_new_salary: grossNewSalary,
        total_fine_deductions: totalFines,
        deductions,
        net_new_salary: netNewSalary,
      };
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Failed to fetch salary increments:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// const ObjectId = mongoose.Types.ObjectId;
app.get("/permissions/:userId", async (req, res) => {
  try {
    const permission = await Permission.findOne({
      userId: new ObjectId(req.params.userId),
    });
    res.json(permission || {});
  } catch (err) {
    res.status(400).json({ error: "Invalid user ID" });
  }
});

app.post("/permissions", async (req, res) => {
  try {
    let { userId, operations } = req.body;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    userId = new mongoose.Types.ObjectId(userId);
    let existing = await Permission.findOne({ userId });
    if (existing) {
      existing.operations = operations;
      await existing.save();
      res.json({ message: "Permissions updated" });
    } else {
      const newPermission = new Permission({ userId, operations });
      await newPermission.save();
      res.json({ message: "Permissions created" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 1000;
app.listen(PORT, () => {
  console.log("Server running at http://localhost:1000");
});
