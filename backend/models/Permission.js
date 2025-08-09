// models/Permission.js
const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema({
  // refernce to the employee schmea ,connection is happeing two schema
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  operations: [
    {
      code: String,
      access: Boolean,
    },
  ],
});
module.exports = mongoose.model("Permission", permissionSchema);

// e.g
// Employee document in MongoDB:
// json
// {
//   "_id": "66a33cf8bdfc1b001f0b1234",
//   "name": "Alice",
//   "email": "alice@gmail.com",
// }
// Permission document:
// json
// {
//   "_id": "66a33ef1fcd920001e78a456",
//   "userId": "66a33cf8bdfc1b001f0b1234",  // reference to Employee
//   "operations": [
//     { "code": "E-Add", "access": true },
//     { "code": "E-Edit", "access": false }
//   ]
// }