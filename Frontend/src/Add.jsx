import { useState } from "react";
import axios from "axios";
import PropTypes from "prop-types";

const Add = ({ permissions }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    date_of_joining: "",
   
    level: "",
    experience: "",
    role: "employee",
  });

  const hasAccess = (code) => {
    const role = JSON.parse(localStorage.getItem("user"))?.role?.toLowerCase();
    if (role === "admin" || role === "superadmin") return true;
    return permissions?.some((p) => p.code === code && p.access);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:1000/employees/add", formData);
      alert("User added successfully");
    } catch (err) {
      console.error("Error adding employee:", err);
      alert("Error while submitting form.");
    }
  };

  if (!hasAccess("E-Add")) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger text-center">
          ❌ You do not have permission to add employees.
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="card shadow-lg p-4">
        <h3 className="text-center text-primary mb-4">➕ Add New Employee</h3>
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Name</label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Phone</label>
              <input
                type="text"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label">Address</label>
              <textarea
                name="address"
                className="form-control"
                rows="2"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Date of Joining</label>
              <input
                type="date"
                name="date_of_joining"
                className="form-control"
                value={formData.date_of_joining}
                onChange={handleChange}
                required
              />
            </div>

            {/* <div className="col-md-6">
              <label className="form-label">Salary (₹)</label>
              <input
                type="number"
                name="salary"
                className="form-control"
                value={formData.salary}
                onChange={handleChange}
                required
              />
            </div> */}

            <div className="col-md-6">
              <label className="form-label">Level</label>
              <select
                name="level"
                className="form-select"
                value={formData.level}
                onChange={handleChange}
                required
              >
                <option value="">Select Level</option>
                <option value="Fresher">Fresher</option>
                <option value="Mid-Level">Mid-Level</option>
                <option value="Expert">Expert</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Experience (Years)</label>
              <input
                type="number"
                name="experience"
                className="form-control"
                value={formData.experience}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Role</label>
              <select
                name="role"
                className="form-select"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="employee">Employee</option>
                <option value="hr">HR</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>

            <div className="col-12 text-center mt-3">
              <button type="submit" className="btn btn-success px-4">
                Add Employee
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

Add.propTypes = {
  permissions: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      access: PropTypes.bool.isRequired,
    })
  ),
};

Add.defaultProps = {
  permissions: [],
};

export default Add;
