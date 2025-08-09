const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Employee = require("../models/Employee");
const Task = require("../models/Task");
router.get("/task", async (req, res) => {
  try {
    const tasks = await Task.find();
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Error fetching tasks" });
  }
});

router.get("/task/:name", async (req, res) => {
  try {
    const tasks = await Task.find({ employeeName: req.params.name });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// modify
router.post("/task/add", async (req, res) => {
  try {
    const { taskName, duration, employeeName } = req.body;
    const task = new Task({
      taskName,
      duration,
      employeeName,
      createdAt: new Date(), // Add this
    });
    await task.save();
    res.status(201).json({ message: "Task added successfully", task });
  } catch (err) {
    res.status(500).json({ error: "Error adding task" });
  }
});

// Get weekly ratings for an employee
router.get("/task/ratings/weekly/:employeeName", async (req, res) => {
  try {
    const { employeeName } = req.params;
    const today = new Date();
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    // Get start of week (Monday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

    // Find all tasks for this employee in the last 7 days
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 6); // 7 days including today
    const tasks = await Task.find({
      employeeName,
      $or: [
        { startedAt: { $gte: oneWeekAgo } },
        { createdAt: { $gte: oneWeekAgo } },
      ],
    });
    //console
    console.log("Today's date:", today);
    console.log(
      "Tasks fetched for weekly rating:",
      tasks.map((t) => ({
        startedAt: t.startedAt,
        rating: t.rating,
        taskName: t.taskName,
      }))
    );

    // Group tasks by weekday (use only startedAt)
    const dayMap = {};
    tasks.forEach((task) => {
      const day = task.startedAt
        ? new Date(task.startedAt).toLocaleDateString("en-US", {
            weekday: "short",
          })
        : null;
      if (day) {
        if (!dayMap[day]) dayMap[day] = [];
        dayMap[day].push(task.rating);
      }
    });

    // Build daily averages for Mon-Sun
    const dailyRatings = weekDays.map((day) => {
      const ratings = dayMap[day] || [];
      return {
        day,
        average:
          ratings.length > 0
            ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
            : 0,
        count: ratings.length,
      };
    });

    // Overall average
    const allRatings = tasks.map((t) => t.rating);
    const averageRating =
      allRatings.length > 0
        ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(2)
        : 0;
    console.log({
      employeeName,
      totalTasks: tasks.length,
      averageRating,
      dailyRatings,
      tasks, // Optional: Log tasks if you want to see all task details
    });
    res.status(200).json({
      employeeName,
      totalTasks: tasks.length,
      averageRating,
      dailyRatings,
      tasks,
    });
  } catch (err) {
    res.status(500).json({ error: "Error fetching weekly ratings" });
  }
});
router.get("/task/ratings/monthly/:employeeName", async (req, res) => {
  try {
    const { employeeName } = req.params;
    const today = new Date();
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    // Get start of current year
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    // Find all tasks for this employee in the current year
    const tasks = await Task.find({
      employeeName,
      $or: [
        { startedAt: { $gte: startOfYear } },
        { createdAt: { $gte: startOfYear } },
      ],
    });
    // Group tasks by month
    const monthMap = {};
    tasks.forEach((task) => {
      const date = task.startedAt || task.createdAt;
      const month = date
        ? new Date(date).toLocaleString("en-US", { month: "short" })
        : null;
      if (month) {
        if (!monthMap[month]) monthMap[month] = [];
        monthMap[month].push(
          typeof task.rating === "number" ? task.rating : Number(task.rating)
        );
      }
    });
    // Build monthly ratings for all months
    const monthlyRatings = months.map((month) => {
      const ratings = monthMap[month] || [];
      return {
        month,
        totalTasks: ratings.length,
        averageRating:
          ratings.length > 0
            ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
            : 0,
      };
    });
    // Overall average
    const allRatings = tasks.map((t) =>
      typeof t.rating === "number" ? t.rating : Number(t.rating)
    );
    const averageRating =
      allRatings.length > 0
        ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
        : 0;
    res.status(200).json({
      employeeName,
      totalTasks: tasks.length,
      averageRating: averageRating.toFixed(2),
      monthlyRatings,
      tasks,
    });
  } catch (err) {
    console.error("Error in monthly ratings:", err);
    res.status(500).json({ error: "Error fetching monthly ratings" });
  }
});

// only geting rating weekly
// Get weekly ratings for all employees grouped by day
router.get("/task/ratings/weekly", async (req, res) => {
  try {
    const today = new Date();
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 6); // Last 7 days

    // Get all tasks from the last week
    const tasks = await Task.find({
      $or: [
        { startedAt: { $gte: oneWeekAgo } },
        { createdAt: { $gte: oneWeekAgo } },
        { completedAt: { $gte: oneWeekAgo } },
      ],
      rating: { $exists: true }, // Only include tasks with ratings
    });

    // Get all unique employee names
    const employees = await Task.distinct("employeeName", {
      $or: [
        { startedAt: { $gte: oneWeekAgo } },
        { createdAt: { $gte: oneWeekAgo } },
      ],
    });

    // Initialize data structure
    const weeklyData = weekDays.map((day) => ({ day }));

    // Process each employee's ratings
    await Promise.all(
      employees.map(async (employeeName) => {
        const employeeTasks = tasks.filter(
          (t) => t.employeeName === employeeName
        );

        // Group by day
        const dayMap = {};
        employeeTasks.forEach((task) => {
          const date = task.startedAt || task.createdAt;
          const day = date
            ? new Date(date).toLocaleDateString("en-US", { weekday: "short" })
            : null;
          if (day) {
            if (!dayMap[day]) dayMap[day] = [];
            dayMap[day].push(task.rating);
          }
        });
        // Add to weekly data
        weeklyData.forEach((dayData) => {
          const ratings = dayMap[dayData.day] || [];
          dayData[employeeName] =
            ratings.length > 0
              ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
              : 0;
        });
      })
    );

    res.status(200).json({
      weekDays,
      employees,
      weeklyData,
      fromDate: oneWeekAgo,
      toDate: today,
    });
  } catch (err) {
    console.error("Error fetching weekly ratings:", err);
    res.status(500).json({ error: "Error fetching weekly ratings" });
  }
});

// Get monthly ratings for all employees grouped by month
router.get("/task/ratings/monthly", async (req, res) => {
  try {
    const today = new Date();
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Get all tasks from this year
    const tasks = await Task.find({
      $or: [
        { startedAt: { $gte: startOfYear } },
        { createdAt: { $gte: startOfYear } },
      ],
      rating: { $exists: true },
    });

    // Get all unique employee names
    const employees = await Task.distinct("employeeName", {
      $or: [
        { startedAt: { $gte: startOfYear } },
        { createdAt: { $gte: startOfYear } },
      ],
    });

    // Initialize data structure
    const monthlyData = months.map((month) => ({ month }));

    // Process each employee's ratings
    await Promise.all(
      employees.map(async (employeeName) => {
        const employeeTasks = tasks.filter(
          (t) => t.employeeName === employeeName
        );

        // Group by month
        const monthMap = {};
        employeeTasks.forEach((task) => {
          const date = task.startedAt || task.createdAt;
          const month = date
            ? new Date(date).toLocaleString("en-US", { month: "short" })
            : null;
          if (month) {
            if (!monthMap[month]) monthMap[month] = [];
            monthMap[month].push(task.rating);
          }
        });

        // Add to monthly data
        monthlyData.forEach((monthData) => {
          const ratings = monthMap[monthData.month] || [];
          monthData[employeeName] =
            ratings.length > 0
              ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
              : 0;
        });
      })
    );

    res.status(200).json({
      months,
      employees,
      monthlyData,
      fromDate: startOfYear,
      toDate: today,
    });
  } catch (err) {
    console.error("Error fetching monthly ratings:", err);
    res.status(500).json({ error: "Error fetching monthly ratings" });
  }
});

router.put("/task/complete/:id", async (req, res) => {
  try {
    const { elapsedMinutes } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    const target = task.duration;
    let rating = 1;
    if (elapsedMinutes <= target - 2) rating = 5;
    else if (elapsedMinutes <= target - 1) rating = 4;
    else if (elapsedMinutes <= target) rating = 3;
    else if (elapsedMinutes <= target + 1) rating = 2;
    task.finishedIn = elapsedMinutes;
    task.rating = rating;
    await task.save();
    res.status(200).json({ message: "Task completed", task });
  } catch (err) {
    res.status(500).json({ error: "Failed to complete task" });
  }
});

router.put("/task/start/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { startedAt: new Date() },
      { pausedAt: now },
      { new: true }
    );
    res.status(200).json({ message: "Task started", task });
  } catch (err) {
    res.status(500).json({ error: "Failed to start task" });
  }
});

router.put("/task/pause/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || !task.startedAt)
      return res.status(400).json({ error: "Task not started" });

    const now = new Date();
    const durationInMinutes = (now - new Date(task.startedAt)) / (1000 * 60);

    let rating = 1;
    if (durationInMinutes <= task.duration - 2) rating = 5;
    else if (durationInMinutes <= task.duration - 1) rating = 4;
    else if (durationInMinutes <= task.duration) rating = 3;
    else if (durationInMinutes <= task.duration + 1) rating = 2;

    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      {
        pausedAt: now,
        finishedIn: durationInMinutes.toFixed(2),
        rating,
      },
      { new: true }
    );

    res.status(200).json({ message: "Task paused", task: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to pause task" });
  }
});

router.delete("/task/delete/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.status(200).json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// GET /task/:id
router.get("/task/:id", async (req, res) => {
  const task = await Task.findById(req.params.id);
  res.json({ task });
});
router.get("/task", async (req, res) => {
  const { employeeName } = req.query;
  const tasks = await Task.find({ employeeName });
  res.json(tasks);
});
module.exports = router;
