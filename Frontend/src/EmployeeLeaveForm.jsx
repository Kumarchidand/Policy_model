import { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";
import { Link } from "react-router-dom";

// This component uses Bootstrap for styling, with additional custom CSS for the background gradient and visual polish.

const EmployeeLeaveForm = () => {
  const employeeId =
    localStorage.getItem("employeeId") || localStorage.getItem("userId");
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [formData, setFormData] = useState({
    fromDate: "",
    toDate: "",
    reason: "",
  });
  const [statusCount, setStatusCount] = useState(0);
  const [employeeName, setEmployeeName] = useState("");
  const [message, setMessage] = useState("");
  const [totalDays, setTotalDays] = useState(0);
  const [policyInfo, setPolicyInfo] = useState(null);
  const [lwpDays, setLwpDays] = useState(0);

  // Fetch count of approved or rejected leave requests for badge display
  useEffect(() => {
    const fetchStatusCount = async () => {
      try {
        const res = await axios.get(
          `http://localhost:1000/leaves/status/count/${employeeId}`
        );
        setStatusCount(res.data.count || 0);
      } catch (err) {
        setStatusCount(0);
        console.error("Error fetching leave status count:", err);
      }
    };
    fetchStatusCount();
  }, [employeeId]);

  // Fetch employee details
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await axios.get(
          `http://localhost:1000/employees/${employeeId}`
        );
        setEmployeeName(res.data.name);
      } catch (err) {
        setMessage("Failed to load employee details", err);
      }
    };
    fetchEmployee();
  }, [employeeId]);

  // Fetch leave types from HR policy
  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const res = await axios.get("http://localhost:1000/hr-policy2");
        setLeaveTypes(res.data.leaveTypes || []);
      } catch (err) {
        console.error("Error fetching leave types", err);
      }
    };
    fetchLeaveTypes();
  }, []);

  // Auto-fill policy info when leave type changes
  useEffect(() => {
    const selected = leaveTypes.find((lt) => lt.type === selectedType);
    setPolicyInfo(selected || null);
  }, [selectedType, leaveTypes]);

  // Calculate leave days and LWP logic
  useEffect(() => {
    if (formData.fromDate && formData.toDate) {
      const start = moment(formData.fromDate);
      const end = moment(formData.toDate);
      const days = end.diff(start, "days") + 1;

      if (days > 0) {
        setTotalDays(days);
        if (policyInfo && days > policyInfo.maxPerRequest) {
          setLwpDays(days - policyInfo.maxPerRequest);
        } else {
          setLwpDays(0);
        }
      } else {
        setTotalDays(0);
        setLwpDays(0);
      }
    }
  }, [formData.fromDate, formData.toDate, policyInfo]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedType || !formData.fromDate || !formData.toDate) {
      setMessage("Please fill all required fields");
      return;
    }

    // Validate against maxPerRequest
    if (policyInfo && totalDays > policyInfo.maxPerRequest) {
      setMessage(
        `You cannot request more than ${policyInfo.maxPerRequest} day(s) for this leave type at once. Please reduce the selected date range.`
      );
      return;
    }

    try {
      const res = await axios.post("http://localhost:1000/leaves", {
        employeeId,
        employeeName,
        leaveType: selectedType,
        fromDate: new Date(formData.fromDate),
        toDate: new Date(formData.toDate),
        totalDays,
        lwpDays,
        reason: formData.reason,
      });

      setMessage(res.data.message || "Leave submitted");

      // Reset form
      setFormData({
        fromDate: "",
        toDate: "",
        reason: "",
      });
      setSelectedType("");
      setTotalDays(0);
      setLwpDays(0);
    } catch (err) {
      console.error("Error submitting leave:", err);
      const backendMessage =
        err.response?.data?.message || "Failed to submit leave request";

      setMessage(backendMessage);
    }
  };
  return (
    <div className="bg-gradient">
      <style>
        {`
        .bg-gradient {
          background: #3952a3;
          background: -webkit-linear-gradient(to right, #6584c6, #3952a3);
          background: linear-gradient(to right, #6584c6, #3952a3);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card {
          border: none;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          transition: transform 0.3s ease-in-out;
        }

        .card:hover {
          transform: translateY(-5px);
        }

        .form-label {
          font-weight: 600;
          color: #555;
        }
        
        .form-control, .form-select {
          border-radius: 0.5rem;
          border-color: #ddd;
          transition: border-color 0.2s;
        }

        .form-control:focus, .form-select:focus {
          border-color: #3952a3;
          box-shadow: 0 0 0 0.25rem rgba(57, 82, 163, 0.25);
        }
        
        .btn-submit {
          background-color: #3952a3;
          border-color: #3952a3;
          font-weight: bold;
          font-size: 1.1rem;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .btn-submit::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 300%;
            height: 300%;
            background: rgba(255, 255, 255, 0.15);
            transition: all 0.7s ease-out;
            border-radius: 50%;
            transform: translate(-50%, -50%) scale(0);
        }
        
        .btn-submit:hover::before {
            transform: translate(-50%, -50%) scale(1);
        }

        .btn-outline-secondary {
            color: #6c757d;
            border-color: #6c757d;
        }
      
        .btn-outline-secondary:hover {
            background-color: #6c757d;
            color: white;
            border-color: #6c757d;
        }

        .badge {
          font-weight: 600;
        }
        `}
      </style>
      <div className="container py-4">
        <div
          className="card shadow border-0 mx-auto rounded-4 animate__animated animate__fadeIn"
          style={{ maxWidth: 650 }}
        >
          <div className="card-body p-5">
            <h2 className="mb-2 text-center fw-bold text-dark">
              <i className="bi bi-calendar-heart-fill me-2 text-primary"></i>{" "}
              Leave Request
            </h2>
            <p className="text-muted text-center mb-4">
              Fill in your leave details below.
            </p>
            {/* EMPLOYEE INFO */}
            {employeeName && (
              <div className="mb-3 text-center">
                <span className="fw-semibold text-dark">
                  <i className="bi bi-person-circle me-1"></i>
                  {employeeName}
                </span>
              </div>
            )}
            {/* MESSAGES */}
            {message && (
              <div
                className={`toast-sucess${
                  message.includes("Failed") ? "alert-danger" : "alert-success"
                } text-center py-2`}
              >
                <i
                  className={`bi me-1 ${
                    message.includes("Failed")
                      ? "bi-exclamation-circle-fill"
                      : "bi-check-circle-fill"
                  }`}
                ></i>
                {message}
              </div>
            )}
            <form onSubmit={handleSubmit} className="needs-validation">
              {/* LEAVE TYPE */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Leave Type <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select rounded-3"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  required
                >
                  <option value="">-- Select Leave Type --</option>
                  {leaveTypes.map((lt) => (
                    <option key={lt.type} value={lt.type}>
                      {lt.label || lt.type}
                    </option>
                  ))}
                </select>
              </div>

              {/* POLICY INFO */}
              {policyInfo && (
                <div className="alert alert-info small py-2 rounded-3 mb-3">
                  <div className="row gx-3 gy-1">
                    <div className="col-6">
                      <strong>Mode:</strong> {policyInfo.mode}
                    </div>
                    <div className="col-6">
                      <strong>Max/Request:</strong> {policyInfo.maxPerRequest}d
                    </div>
                    <div className="col-12">
                      <strong>Total/Year:</strong> {policyInfo.normalDays} days
                    </div>
                  </div>
                </div>
              )}

              {/* DATE PICKERS */}
              <div className="row mb-3">
                <div className="col">
                  <label className="form-label fw-semibold">
                    From <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-calendar-event"></i>
                    </span>
                    <input
                      type="date"
                      name="fromDate"
                      className="form-control"
                      value={formData.fromDate}
                      onChange={handleChange}
                      required
                      // min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>
                <div className="col">
                  <label className="form-label fw-semibold">
                    To <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-calendar-range"></i>
                    </span>
                    <input
                      type="date"
                      name="toDate"
                      className="form-control"
                      value={formData.toDate}
                      onChange={handleChange}
                      required
                      min={formData.fromDate}
                    />
                  </div>
                </div>
              </div>
              {/* DAY COUNT DISPLAY */}
              {totalDays > 0 && (
                <div className="text-center mb-3">
                  <span className="badge bg-light border border-secondary text-dark px-3 py-2">
                    <strong>{totalDays}</strong> day(s) requested
                  </span>
                  {/* {lwpDays > 0 && (
                    <div className="mt-2 small text-danger">
                      <i className="bi bi-exclamation-circle me-1"></i>
                      <strong>{lwpDays}</strong> day(s) will be considered LWP
                    </div>
                  )} */}
                </div>
              )}

              {/* REASON */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Reason <span className="text-muted">(optional)</span>
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Reason for leave"
                />
              </div>
              {/* SUBMIT BUTTON */}
              <button
                className="btn btn-primary btn-submit w-100 py-2"
                type="submit"
              >
                <i className="bi bi-send-plus me-2"></i>Submit Request
              </button>
            </form>

            <hr className="my-4" />

            {/* STATUS BUTTON */}
            <div className="text-center">
              <Link
                to="/estatus"
                className="btn btn-outline-secondary px-4 py-2 position-relative rounded-pill"
              >
                <i className="bi bi-list-check me-2"></i>View Leave Status
                {statusCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {statusCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLeaveForm;
