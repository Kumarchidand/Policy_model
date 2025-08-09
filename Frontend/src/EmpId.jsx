import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const EmpId = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState({});
  const [tasks, setTasks] = useState([]);
  const [taskName, setTaskName] = useState("");
  const [duration, setDuration] = useState("");
  const [timers, setTimers] = useState({});
  const [startTimes, setStartTimes] = useState({});

  useEffect(() => {
    console.log("EmpId.jsx: id param:", id);
    axios
      .get(`http://localhost:1000/employees/${id}`)
      .then((res) => {
        console.log("EmpId.jsx: employee fetch result:", res.data);
        if (res.data) {
          setEmployee(res.data);
          fetchTasks(res.data.name);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch employee", err);
        navigate("/");
      });
  }, [id]);

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

  return (
    <div className="container-fluid px-0">
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <span className="navbar-brand">
            Welcome <i className="fa-regular fa-user"></i> {employee.name}
          </span>

          <div className="text-white d-flex flex-column me-4">
            <small>📧 {employee.email}</small>
            <small>📱 {employee.phone}</small>
            <small>
              🗓️ DOJ:{" "}
              {employee.date_of_joining &&
                new Date(employee.date_of_joining).toLocaleDateString()}
            </small>
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
            <i className="fa fa-sign-out"></i>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mt-4">
        <h3 className="mb-4">📝 Task Dashboard</h3>

        {/* Add Task Form */}
        <div className="card shadow p-3 mb-4">
          <h5 className="mb-3">Assign New Task</h5>
          <form onSubmit={handleAddTask} className="row g-3">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Task Name"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <input
                type="number"
                className="form-control"
                placeholder="Duration (mins)"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-success w-100">
                Add Task
              </button>
            </div>
          </form>
        </div>

        {/* Task Table */}
        <h5>Your Tasks</h5>
        {tasks.length === 0 ? (
          <p className="text-muted">No tasks assigned yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead className="table-dark">
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
                  <tr key={task._id}>
                    <td>{task.taskName}</td>
                    <td>{task.duration} mins</td>
                    <td>{task.finishedIn || "-"} mins</td>
                    <td>
                      {task.rating ? (
                        <span className="text-success">
                          {"⭐".repeat(task.rating)} ({task.rating}/5)
                        </span>
                      ) : (
                        <span className="text-muted">Not Rated</span>
                      )}
                    </td>
                    <td>
                      {task.finishedIn ? (
                        <span className="badge bg-success">Completed</span>
                      ) : (
                        <span className="badge bg-warning text-dark">
                          Pending
                        </span>
                      )}
                    </td>
                    <td>
                      {!task.finishedIn ? (
                        <>
                          {!startTimes[task._id] ? (
                            <button
                              className="btn btn-sm btn-primary me-2"
                              onClick={() => handleStart(task._id)}
                            >
                              Start
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-warning me-2"
                              onClick={() => handlePause(task._id)}
                            >
                              Pause / Complete
                            </button>
                          )}
                        </>
                      ) : (
                        <button className="btn btn-sm btn-success" disabled>
                          ✅ Completed
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

export default EmpId;
