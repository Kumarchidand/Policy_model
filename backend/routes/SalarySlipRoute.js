const express = require("express");
const router = express.Router();
const MonthlySalarySlip = require("../models/SalarySlip");
const PDFDocument = require("pdfkit");
const Employee = require("../models/Employee");

// POST /salary-slip/save-all
router.post("/salary-slip/save-all", async (req, res) => {
  try {
    const { month, year, slips } = req.body;

    const existing = await MonthlySalarySlip.findOne({ month, year });

    if (existing) {
      // Update the entire slips array
      existing.slips = slips;
      await existing.save();
      return res
        .status(200)
        .json({ message: "Salary slips updated successfully" });
    }

    // Create new document
    const newRecord = new MonthlySalarySlip({ month, year, slips });
    await newRecord.save();

    res.status(201).json({ message: "Salary slips saved successfully" });
  } catch (err) {
    console.error("Error saving salary slips:", err);
    res.status(500).json({ message: "Failed to save salary slips" });
  }
});

// router.get("/salary-slip/download", async (req, res) => {
//   try {
//     const { employeeId, month, year } = req.query;

//     if (!employeeId || !month || !year) {
//       return res.status(400).send("Missing query parameters");
//     }

//     // 1. Fetch Employee
//     const employee = await Employee.findById(employeeId);
//     if (!employee) return res.status(404).send("Employee not found");

//     // 2. Fetch Salary Slip
//     const slip = await MonthlySalarySlip.findOne({ employeeId, month, year });
//     if (!slip) return res.status(404).send("Salary slip not found");

//     // 3. Create PDF
//     const doc = new PDFDocument();

//     // 4. Set response headers
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=SalarySlip-${employee.name}-${month}-${year}.pdf`
//     );

//     // 5. Pipe PDF output to response
//     doc.pipe(res);

//     // 6. Generate PDF content
//     doc.fontSize(20).text("Company Name Pvt Ltd", { align: "center" });
//     doc.fontSize(16).text("Salary Slip", { align: "center" });
//     doc.moveDown();

//     doc.fontSize(12);
//     doc.text(`Employee Name: ${employee.name}`);
//     doc.text(`Employee ID: ${employee._id}`);
//     doc.text(`Month: ${month}`);
//     doc.text(`Year: ${year}`);
//     doc.moveDown();

//     doc.text(`Gross Salary: ₹${slip.grossSalary?.toFixed(2)}`);
//     doc.text(`Net Salary: ₹${slip.netSalary?.toFixed(2)}`);
//     doc.text(`Working Days: ${slip.totalWorkingDays}`);
//     doc.text(`Present Days: ${slip.presentDays}`);
//     doc.text(`Paid Leaves: ${slip.paidLeaves}`);
//     doc.text(`Unpaid Leaves: ${slip.unpaidLeaves}`);
//     doc.text(`Deductions: ₹${slip.deductionAmount?.toFixed(2)}`);
//     doc.moveDown();

//     doc.text("Thank you!", { align: "center" });

//     // 7. Finalize PDF
//     doc.end();
//   } catch (error) {
//     console.error("Download error:", error);
//     res.status(500).send("Error generating PDF");
//   }
// });

module.exports = router;
