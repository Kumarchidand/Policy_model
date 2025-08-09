const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Employee = require("../models/Employee");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const createUser = async () => {
  try {
    const existingUser = await User.findOne({ email: "test@gmail.com" });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash("123", 10);
      const user = new User({
        name: "Test",
        email: "test@gmail.com",
        password: hashedPassword,
        role: "admin",
      });
      await user.save();
      console.log("Test user created");
    }
  } catch (err) {
    console.error("Error creating test user:", err);
  }
};
createUser();

router.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }
  // doubt
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const valid = await bcrypt.compare(password, user.password);
    // compare with ui password with user.passward in db
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    // generate token
    const token = jwt.sign({ id: user._id, role: user.role }, "SECRET_KEY", {
      expiresIn: "1d",
    });
    // set cookie (HTTP only)
    // res.cookie("token", token, {
    //   httpOnly: true,
    //   secure: false,
    //   sameSite: "none",
    //   maxAge: 24 * 60 * 60 * 1000,
    // });
    // send token + user object to frontend with out token
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
module.exports = router;
