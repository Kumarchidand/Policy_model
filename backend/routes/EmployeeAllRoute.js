const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Employee = require("../models/Employee");
const SalaryIncrement = require("../models/SalaryIncrement");
router.put("/employees/:id", async (req, res) => {
  try {
    const updated = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ error: "Employee not found" });
    res.status(200).json({ message: "Employee updated", employee: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update employee" });
  }
});
router.get("/employees", async (req, res) => {
  try {
    const { name } = req.query;
    if (name) {
      const employee = await Employee.findOne({ name });
      if (!employee)
        return res.status(404).json({ error: "Employee not found" });
      return res.status(200).json(employee);
    }
    const employees = await Employee.find();
    res.status(200).json(employees);
  } catch (err) {
    res.status(500).json({ error: "Error fetching employees" });
  }
});
router.get("/employees/:id", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ error: "Employee not found" });
    res.status(200).json(employee);
  } catch (err) {
    res.status(500).json({ error: "Error fetching employee" });
  }
});
router.post("/employees/add", async (req, res) => {
  try {
    const employee = new Employee(req.body);
    await employee.save();

    const doj = new Date(employee.date_of_joining);
    const today = new Date();
    const experienceInYears = (today - doj) / (1000 * 60 * 60 * 24 * 365);

    let rating = 1;
    if (experienceInYears >= 5) rating = 5;
    else if (experienceInYears >= 3) rating = 4;
    else if (experienceInYears >= 2) rating = 3;
    else if (experienceInYears >= 1) rating = 2;

    await SalaryIncrement.create({
      name: employee.name,
      date_of_joining: employee.date_of_joining,
      current_salary: employee.salary,
      performance_rating: rating,
    });

    res.status(201).json({ message: "Employee added successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error adding employee" });
  }
});
router.delete("/employees/delete/:id", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    await Employee.findByIdAndDelete(req.params.id);
    await SalaryIncrement.deleteMany({ name: employee.name });
    await Task.deleteMany({ employeeName: employee.name });

    res.status(200).json({ message: "Employee and related data deleted" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting employee" });
  }
});
router.get("/employees/:id", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.status(200).json(employee);
  } catch (err) {
    console.error("Error fetching employee by ID:", err);
    res.status(500).json({ error: "Server error while fetching employee" });
  }
});

router.put("/employees/update-role/:id", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["employee", "hr", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    const updated = await Employee.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );
    res.status(200).json({ message: "Role updated", employee: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update role" });
  }
});
module.exports = router;
