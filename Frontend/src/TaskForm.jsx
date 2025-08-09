import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import PropTypes from "prop-types";

const TaskForm = ({ permissions }) => {
  const { id: paramId } = useParams();
  const navigate = useNavigate();

  // Get user info
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role ? user.role.toLowerCase() : null;
  const isAdmin = role === "admin";
  // const isHR = role === "hr";

  // Use employeeId from localStorage if present (set after HR login), else fallback to userId
  const userId =
    paramId ||
    localStorage.getItem("employeeId") ||
    localStorage.getItem("userId");
  const [employee, setEmployee] = useState({});
  const [tasks, setTasks] = useState([]);
  const [taskName, setTaskName] = useState("");
  const [duration, setDuration] = useState("");
  const [timers, setTimers] = useState({});
  const [startTimes, setStartTimes] = useState({});

  // Permission check helper
  const hasAccess = (code) => {
    if (isAdmin) return true;
    return permissions?.some((p) => p.code === code && p.access);
  };

  useEffect(() => {
    // CHANGED: Only fetch employee if userId is present and valid
    if (!userId || userId === "undefined") {
      // Do not fetch if id is not present
      return;
    }
    console.log(userId);
    axios
      .get(`http://localhost:1000/employees/${userId}`)
      .then((res) => {
        if (res.data) {
          setEmployee(res.data);
          fetchTasks(res.data.name);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch employee:", err);
        navigate("/");
      });
  }, [userId]);

  const fetchTasks = (empName) => {
    axios
      .get(`http://localhost:1000/task/${empName}`)
      .then((res) => setTasks(res.data))
      .catch((err) => console.error("Task fetch error", err));
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskName || !duration) return alert("Please enter task details");

    try {
      const newTask = {
        taskName,
        duration,
        employeeName: employee.name,
      };

      await axios.post("http://localhost:1000/task/add", newTask);
      setTaskName("");
      setDuration("");
      fetchTasks(employee.name);
    } catch (err) {
      console.error("Failed to add task", err);
    }
  };

  const handleStart = async (taskId) => {
    const now = Date.now();
    setStartTimes((prev) => ({ ...prev, [taskId]: now }));
    const interval = setInterval(() => fetchTasks(employee.name), 60000);
    setTimers((prev) => ({ ...prev, [taskId]: interval }));
    await axios.put(`http://localhost:1000/task/start/${taskId}`);
  };

  const handlePause = async (taskId) => {
    const end = Date.now();
    const start = startTimes[taskId];
    const elapsedMinutes = ((end - start) / 60000).toFixed(2);

    clearInterval(timers[taskId]);
    setTimers((prev) => {
      const copy = { ...prev };
      delete copy[taskId];
      return copy;
    });

    await axios.put(`http://localhost:1000/task/complete/${taskId}`, {
      elapsedMinutes,
    });

    fetchTasks(employee.name);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const averageRating =
    tasks.length > 0
      ? (
          tasks.reduce((acc, task) => acc + (task.rating || 0), 0) /
          tasks.filter((task) => task.rating).length
        ).toFixed(1)
      : "N/A";

 // ... (imports and setup unchanged)

return (
  <div className="container-fluid px-0">
    {/* Top Navbar */}
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4">
      <div className="container-fluid d-flex justify-content-between align-items-center">
        <span className="navbar-brand">
          <i className="bi bi-person-circle me-2"></i> {employee.name}
        </span>

        <div className="text-white d-flex flex-column me-4 small">
          <span><i className="bi bi-envelope-fill me-2"></i>{employee.email}</span>
          <span><i className="bi bi-telephone-fill me-2"></i>{employee.phone}</span>
          <span>
            <i className="bi bi-calendar-check me-2"></i>
            DOJ: {employee.date_of_joining && new Date(employee.date_of_joining).toLocaleDateString()}
          </span>
        </div>

        <div className="text-white me-4">
          <span className="fw-semibold text-warning">⭐ Avg Rating:</span>{" "}
          {averageRating !== "N/A" ? (
            <span className="text-warning">{averageRating} / 5.0</span>
          ) : (
            <span className="text-muted">No rated tasks</span>
          )}
        </div>

        <button className="btn btn-outline-light" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right me-1"></i> Logout
        </button>
      </div>
    </nav>

    {/* Main Content */}
    <div className="container mt-4">
      <h3 className="mb-4">
        <i className="bi bi-kanban-fill me-2"></i>Task Dashboard
      </h3>

      {/* Add Task Form */}
      {hasAccess("T-Add") && (
        <div className="card shadow-sm p-4 mb-4 border-0">
          <h5 className="mb-3">
            <i className="bi bi-plus-circle me-2 text-success"></i>Assign New Task
          </h5>
          <form onSubmit={handleAddTask} className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <i className="bi bi-clipboard2-check"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Task Name"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <i className="bi bi-stopwatch"></i>
                </span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Duration (mins)"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-success w-100">
                <i className="bi bi-plus-lg me-1"></i> Add
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task Table */}
      <h5 className="mb-3">
        <i className="bi bi-list-task me-2"></i>Your Tasks
      </h5>

      {tasks.length === 0 ? (
        <p className="text-muted">No tasks assigned yet.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered align-middle shadow-sm">
            <thead className="table-primary text-center">
              <tr>
                <th>Task</th>
                <th>Duration</th>
                <th>Finished In</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task._id} className="text-center">
                  <td>{task.taskName}</td>
                  <td>{task.duration} mins</td>
                  <td>{task.finishedIn || "-"} mins</td>
                  <td>
                    {task.rating ? (
                      [...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={`bi me-1 ${
                            i < task.rating ? "bi-star-fill text-warning" : "bi-star text-muted"
                          }`}
                        />
                      ))
                    ) : (
                      <span className="text-muted">Not Rated</span>
                    )}
                  </td>
                  <td>
                    {task.finishedIn ? (
                      <span className="badge bg-success">
                        <i className="bi bi-check-circle-fill me-1"></i> Completed
                      </span>
                    ) : (
                      <span className="badge bg-warning text-dark">
                        <i className="bi bi-hourglass-split me-1"></i> Pending
                      </span>
                    )}
                  </td>
                  <td>
                    {hasAccess("T-Add") && !task.finishedIn ? (
                      !startTimes[task._id] ? (
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleStart(task._id)}
                        >
                          <i className="bi bi-play-fill me-1"></i> Start
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-outline-warning me-2"
                          onClick={() => handlePause(task._id)}
                        >
                          <i className="bi bi-pause-fill me-1"></i> Pause
                        </button>
                      )
                    ) : (
                      <button className="btn btn-sm btn-success" disabled>
                        <i className="bi bi-check2-circle me-1"></i> Done
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);

};
TaskForm.propTypes = {
  permissions: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      access: PropTypes.bool.isRequired,
    })
  ).isRequired,
};
export default TaskForm;
