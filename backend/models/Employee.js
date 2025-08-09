const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./User");

const employeeSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  address: String,
  date_of_joining: Date,
  // salary: Number,
  level: String,
  experience: Number,
  role: {
    type: String,
    default: "employee", // employee, hr, admin
  },
});

// Post-save hook: after saving Employee, create User
employeeSchema.post(
  "save",
  async function (doc, next) {
    try {
      const existingUser = await User.findOne({ email: doc.email });
      if (existingUser) {
        return next(); // Avoid duplicate user creation
      }

      const rawPassword = doc.name.replace(/\s+/g, "").toLowerCase() + "@123"; // e.g. kumar@123
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      const newUser = new User({
        name: doc.name,
        email: doc.email,
        password: hashedPassword,
        role: doc.role,
      });

      await newUser.save();
      //show in terminal
      console.log(
        ` User created with email: ${doc.email} and auto-generated password.${rawPassword}`
      );
      next();
    } catch (err) {
      console.error("❌ Error creating user from employee:", err);
      next(err);
    }
  },
  { timeStamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
