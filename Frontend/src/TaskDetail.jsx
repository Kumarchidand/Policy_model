import { useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import {
  BsPersonFill,
  BsListTask,
  BsStarFill,
  BsFillPatchCheckFill,
} from "react-icons/bs";
import {
  FaClock,
  FaCheckCircle,
  FaPauseCircle,
  FaPlayCircle,
} from "react-icons/fa";
import { MdPendingActions } from "react-icons/md";
import PropTypes from "prop-types";

const TaskDetail = ({ permissions }) => {
  const location = useLocation();
  const [tasks, setTasks] = useState([]);
  const [timers, setTimers] = useState({});
  const [running, setRunning] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  const hasAccess = (code) => {
    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role?.toLowerCase();
    if (role === "admin") return true;
    return permissions?.some((p) => p.code === code && p.access);
  };

  useEffect(() => {
    fetchTasks();
  }, [location.state?.refresh, refreshKey]);

  const fetchTasks = () => {
    axios.get("http://localhost:1000/task").then((res) => {
      setTasks(res.data);
      const initialTimers = {};
      const initialRunning = {};
      res.data.forEach((task) => {
        initialTimers[task._id] = 0;
        initialRunning[task._id] = false;
      });
      setTimers(initialTimers);
      setRunning(initialRunning);
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const updated = { ...prev };
        for (let id in running) {
          if (running[id]) updated[id] += 1;
        }
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="container py-4">
      <div className="bg-white p-4 p-md-5 rounded-4 shadow border">
        <h2 className="text-center fw-bold text-primary mb-4">
          <MdPendingActions className="me-2" />
          Task Dashboard Overview
        </h2>

        {hasAccess("TASK-View") ? (
          <div className="table-responsive">
            <table className="table table-hover table-bordered align-middle text-center">
              <thead className="table-light text-primary">
                <tr>
                  <th>
                    <BsPersonFill /> Employee
                  </th>
                  <th>
                    <BsListTask /> Task
                  </th>
                  <th>
                    <FaClock /> Duration
                  </th>
                  <th>
                    <BsFillPatchCheckFill /> Finished In
                  </th>
                  <th>
                    <FaClock /> Live Timer
                  </th>
                  <th>Status</th>
                  <th>
                    <BsStarFill /> Rating
                  </th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const isRunning = running[task._id];
                  const isCompleted = task.finishedIn !== undefined;
                  const timerColor = isRunning
                    ? "text-danger fw-semibold"
                    : "text-muted";

                  const rowStyle = isCompleted
                    ? { backgroundColor: "#eafaf1" }
                    : {};

                  return (
                    <tr key={task._id} style={rowStyle}>
                      <td className="fw-medium">{task.employeeName}</td>
                      <td>{task.taskName}</td>
                      <td>{task.duration} min</td>
                      <td>{task.finishedIn ?? "-"}</td>
                      <td className={timerColor}>
                        {formatTime(timers[task._id] || 0)}
                      </td>
                      <td>
                        {isCompleted ? (
                          <span className="badge bg-success-subtle text-success px-3 py-2 rounded-pill shadow-sm">
                            <FaCheckCircle className="me-1" />
                            Completed
                          </span>
                        ) : isRunning ? (
                          <span className="badge bg-warning-subtle text-dark px-3 py-2 rounded-pill shadow-sm">
                            <FaPlayCircle className="me-1" />
                            In Progress
                          </span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-muted px-3 py-2 rounded-pill shadow-sm">
                            <FaPauseCircle className="me-1" />
                            Paused
                          </span>
                        )}
                      </td>
                      <td>
                        {task.rating ? (
                          <span className="text-success fw-bold">
                            {"⭐".repeat(task.rating)} ({task.rating}/5)
                          </span>
                        ) : (
                          <span className="text-muted">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="alert alert-danger text-center fw-semibold fs-5">
            ❌ You do not have permission to view Task Details
          </div>
        )}
      </div>
    </div>
  );
};

TaskDetail.propTypes = {
  permissions: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      access: PropTypes.bool.isRequired,
    })
  ).isRequired,
};

export default TaskDetail;
