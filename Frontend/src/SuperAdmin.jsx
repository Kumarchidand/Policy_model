import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const SuperAdmin = () => {
  const [employees, setEmployees] = useState([]);
  const [taskName, setTaskName] = useState("");
  const [duration, setDuration] = useState("");
  const [selectedHR, setSelectedHR] = useState("");
  const navigate = useNavigate();

  const fetchEmployees = () => {
    axios
      .get("http://localhost:1000/employees")
      .then((res) => setEmployees(res.data))
      .catch((err) => console.error("Error fetching employees", err));
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const deleteEmployee = async (id) => {
    if (window.confirm("Are you sure to delete this employee?")) {
      await axios.delete(`http://localhost:1000/employees/delete/${id}`);
      fetchEmployees();
    }
  };

  const hrEmployees = employees.filter((emp) => emp.role === "hr");

  const assignTask = async (e) => {
    e.preventDefault();
    if (!taskName || !duration || !selectedHR) {
      alert("Please fill all fields");
      return;
    }

    try {
      await axios.post("http://localhost:1000/task/add", {
        taskName,
        duration: Number(duration),
        employeeName: selectedHR,
      });

      alert("Task assigned successfully.");
      setTaskName("");
      setDuration("");
      setSelectedHR("");
      fetchEmployees();
    } catch (err) {
      console.error("Failed to assign task", err);
      alert("Failed to assign task.");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-2">Super Admin Panel</h2>
      <p className="text-muted">Manage employees and assign HR tasks</p>

      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-success" onClick={() => navigate("/add")}>
          ➕ Add Employee
        </button>
      </div>

      {/* Employee Table */}
      <div className="table-responsive">
        <table className="table table-bordered table-hover table-striped align-middle">
          <thead className="table-dark">
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Date of Joining</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp._id}>
                <td>{emp.name}</td>
                <td>{emp.email}</td>
                <td>
                  {emp.role === "hr" ? (
                    <span className="badge bg-info">HR</span>
                  ) : emp.role === "admin" ? (
                    <span className="badge bg-dark">Admin</span>
                  ) : (
                    <span className="badge bg-secondary">Employee</span>
                  )}
                </td>
                <td>
                  {emp.date_of_joining
                    ? new Date(emp.date_of_joining).toLocaleDateString()
                    : "-"}
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => deleteEmployee(emp._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Task Assignment */}
      <div className="card p-4 mt-5 shadow-sm border border-primary">
        <h4 className="mb-3 text-primary">📋 Assign Task to HR</h4>
        <form onSubmit={assignTask}>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Task Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter task"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Duration (mins)</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g., 60"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Select HR</label>
              <select
                className="form-select"
                value={selectedHR}
                onChange={(e) => setSelectedHR(e.target.value)}
              >
                <option value="">-- Choose HR --</option>
                {hrEmployees.map((hr) => (
                  <option key={hr._id} value={hr.name}>
                    {hr.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button type="submit" className="btn btn-primary">
              Assign Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuperAdmin;
