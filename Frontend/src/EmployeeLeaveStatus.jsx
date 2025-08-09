import { useEffect, useState } from "react";
import axios from "axios";

// Helper for sorting leave requests by key and direction
const getSorted = (data, key, direction) => {
  if (!key) return data;
  return [...data].sort((a, b) => {
    let x = a[key],
      y = b[key];
    // Handle undefined/null
    if (x == null && y == null) return 0;
    if (x == null) return direction === "asc" ? -1 : 1;
    if (y == null) return direction === "asc" ? 1 : -1;
    if (typeof x === "string") x = x.toLowerCase();
    if (typeof y === "string") y = y.toLowerCase();
    if (x < y) return direction === "asc" ? -1 : 1;
    if (x > y) return direction === "asc" ? 1 : -1;
    return 0;
  });
};

// Improved date formatting that handles various formats and invalid dates
const formatDate = (value) => {
  if (!value) return "...";

  let date;
  // Support number (timestamp), string of digits, or ISO string
  if (typeof value === "number" || /^\d+$/.test(value)) {
    date = new Date(Number(value));
  } else {
    date = new Date(value);
  }
  if (isNaN(date)) return "...";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Format a date range nicely
const displayDateRange = (from, to) => {
  const f = formatDate(from);
  const t = formatDate(to);
  if (f === "..." && t === "...") return "...";
  return `${f} - ${t}`;
};
const EmployeeLeaveStatus = () => {
  const employeeId = localStorage.getItem("employeeId");

  const [leaveCategoryData, setLeaveCategoryData] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Sorting state
  const [sortKey, setSortKey] = useState("fromDate");
  const [sortDir, setSortDir] = useState("desc");
  const [search, setSearch] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);

  // Fetch leave balances/categories for employee
  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const res = await axios.get(
          `http://localhost:1000/leaves/balance/${employeeId}`
        );
        setLeaveCategoryData(res.data.categories || []);
      } catch (e) {
        setLeaveCategoryData([]);
        console.error(e.message);
      }
    };
    if (employeeId) fetchBalances();
  }, [employeeId]);

  // Fetch leave requests for employee
  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const res = await axios.get(
          `http://localhost:1000/leaves/employee/${employeeId}`
        );
        // Reverse to show latest first
        setLeaveRequests(res.data.reverse() || []);
      } catch (err) {
        setLeaveRequests([]);
        console.error(err.message);
      }
    };
    if (employeeId) fetchLeaves();
  }, [employeeId]);

  // Filter and sort leave requests based on search and sort state
  useEffect(() => {
    let data = leaveRequests;
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(
        (l) =>
          l.leaveType?.toLowerCase().includes(s) ||
          l.status?.toLowerCase().includes(s) ||
          l.message?.toLowerCase().includes(s) ||
          formatDate(l.fromDate).toLowerCase().includes(s) ||
          formatDate(l.toDate).toLowerCase().includes(s)
      );
    }
    setFilteredRequests(getSorted(data, sortKey, sortDir));
    setCurrentPage(1);
  }, [leaveRequests, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) setCurrentPage(page);
  };

  const getStatusBadge = (status) => {
    if (status === "Approved") return "bg-success text-white";
    if (status === "Rejected") return "bg-danger text-white";
    return "bg-warning text-dark";
  };
  const handleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };
  // Table headers configuration
  const tableHeaders = [
    { key: "leaveType", label: "Type" },
    { key: "fromDate", label: "Applied Range" },
    { key: "totalDays", label: "Days" },
    { key: "approvedFromDate", label: "Approved Range" },
    { key: "approvedTotalDays", label: "Approved Days" },
    { key: "status", label: "Status" },
    { key: "message", label: "Remarks" },
  ];

  return (
    <div className="container py-4">
      {/* Leave Balances */}
      <div className="card shadow-lg border-0 rounded-4 bg-white mb-4">
        <div className="card-body">
          <h2 className="fw-bold mb-3 text-primary d-flex align-items-center">
            <i className="bi bi-clipboard-check me-2"></i>Leave Balance Summary
          </h2>
          <div className="table-responsive">
            <table className="table table-borderless table-hover align-middle text-center rounded-3 overflow-hidden">
              <thead className="table-light">
                <tr>
                  <th>
                    <i className="bi bi-tag me-1"></i>Type
                  </th>
                  <th>Frequency</th>
                  <th>Mode</th>
                  <th>Total</th>
                  <th>Used</th>
                  <th>Remaining</th>
                  <th>Max/Request</th>
                </tr>
              </thead>
              <tbody>
                {leaveCategoryData.length > 0 ? (
                  leaveCategoryData.map((cat, index) => (
                    <tr key={index}>
                      <td className="fw-semibold">{cat.type}</td>
                      <td>
                        <span className="badge bg-info-subtle text-primary px-3">
                          {cat.frequency}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border px-3">
                          {cat.mode}
                        </span>
                      </td>
                      <td>{cat.totalAllowed}</td>
                      <td className="text-danger">{cat.used}</td>
                      <td>
                        <span className="badge bg-success-subtle text-success rounded-pill px-3">
                          {cat.remaining}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-primary-subtle text-primary px-3">
                          {cat.maxPerRequest}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-muted py-3">
                      No leave category data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Leave Request History */}
      <div className="card shadow-lg border-0 rounded-4 bg-white">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3 pb-2 border-bottom border-2 border-primary-subtle">
            <h4 className="text-primary m-0">
              <i className="bi bi-clock-history me-2"></i>Leave Request History
            </h4>
            <div className="ms-auto">
              <input
                type="search"
                className="form-control form-control-sm"
                placeholder="Search Type/Status/Date..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ minWidth: "220px", maxWidth: "250px" }}
              />
            </div>
          </div>
          <div className="table-responsive">
            <table className="table align-middle text-center rounded-3 overflow-hidden mb-0 table-striped">
              <thead>
                <tr>
                  {tableHeaders.map((h) => (
                    <th
                      key={h.key}
                      onClick={() => handleSort(h.key)}
                      style={{ cursor: "pointer", userSelect: "none" }}
                      className="text-nowrap"
                      title={`Sort by ${h.label}`}
                    >
                      <span className="d-flex align-items-center justify-content-center">
                        {h.label}
                        <i
                          className={
                            sortKey === h.key
                              ? sortDir === "asc"
                                ? "bi bi-caret-up-fill text-primary ms-1"
                                : "bi bi-caret-down-fill text-primary ms-1"
                              : "bi bi-caret-down ms-1 text-secondary"
                          }
                        ></i>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.length > 0 ? (
                  paginatedRequests.map((leave) => (
                    <tr
                      key={leave._id}
                      tabIndex={0}
                      className={`row-hover-shadow ${
                        selectedRow === leave._id
                          ? "table-active shadow-glow-lg"
                          : ""
                      }`}
                      style={{
                        transition: "box-shadow 0.2s, filter 0.2s",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        setSelectedRow(
                          selectedRow === leave._id ? null : leave._id
                        )
                      }
                      onBlur={() => setSelectedRow(null)}
                      title="Click to select/deselect row"
                    >
                      <td className="fw-semibold">{leave.leaveType}</td>
                      <td
                        title={displayDateRange(leave.fromDate, leave.toDate)}
                      >
                        {displayDateRange(leave.fromDate, leave.toDate)}
                      </td>
                      <td>
                        <span className="badge bg-secondary-subtle text-primary">
                          {leave.totalDays}
                        </span>
                      </td>
                      <td
                        title={displayDateRange(
                          leave.approvedFromDate,
                          leave.approvedToDate
                        )}
                      >
                        {displayDateRange(
                          leave.approvedFromDate,
                          leave.approvedToDate
                        )}
                      </td>
                      <td>
                        <span className="badge bg-success-subtle text-success">
                          {leave.approvedTotalDays || "..."}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge rounded-pill px-3 py-2 text-uppercase fw-semibold ${getStatusBadge(
                            leave.status
                          )} shadow-sm`}
                          data-bs-toggle="tooltip"
                          data-bs-placement="top"
                          title={`Status: ${leave.status}`}
                        >
                          {leave.status}
                        </span>
                      </td>
                      <td>
                        <span
                          className="text-muted text-truncate d-inline-block"
                          style={{ maxWidth: 120, verticalAlign: "middle" }}
                          data-bs-toggle="tooltip"
                          data-bs-placement="top"
                          title={leave.message || "..."}
                        >
                          {leave.message || "..."}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-muted py-3">
                      No leave requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Optional: Show selected row detail */}
          {selectedRow && (
            <div
              className="alert alert-primary border-1 border-primary shadow-sm my-3"
              role="alert"
            >
              <h6 className="fw-bold mb-1">
                <i className="bi bi-info-circle me-1"></i>Request Details
              </h6>
              {(() => {
                const leave = paginatedRequests.find(
                  (l) => l._id === selectedRow
                );
                return leave ? (
                  <div className="small">
                    <strong>Leave Type:</strong> {leave.leaveType} <br />
                    <strong>Applied:</strong>{" "}
                    {displayDateRange(leave.fromDate, leave.toDate)}
                    <br />
                    {/* approved */}
                    <strong>Days:</strong> {leave.approvedTotalDays}
                    <br />
                    <strong>Status:</strong>{" "}
                    <span className={`badge ${getStatusBadge(leave.status)}`}>
                      {leave.status}
                    </span>
                    <br />
                    <strong>Remarks:</strong> {leave.message || "..."}
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredRequests.length > itemsPerPage && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <small className="text-muted">
                Showing{" "}
                {Math.min(
                  (currentPage - 1) * itemsPerPage + 1,
                  filteredRequests.length
                )}
                –{Math.min(currentPage * itemsPerPage, filteredRequests.length)}{" "}
                of {filteredRequests.length}
              </small>
              <ul className="pagination mb-0">
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    &laquo;
                  </button>
                </li>
                {[...Array(totalPages)].map((_, idx) => (
                  <li
                    key={idx}
                    className={`page-item ${
                      currentPage === idx + 1 ? "active" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(idx + 1)}
                    >
                      {idx + 1}
                    </button>
                  </li>
                ))}
                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    &raquo;
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Extra CSS for row interactivity */}
      <style>{`
        .row-hover-shadow:hover:not(.table-active), .row-hover-shadow:focus-visible:not(.table-active) {
          box-shadow: 0 2px 16px 0 rgba(13, 110, 253, 0.16), 0 0.5px 2px #4faaff33;
          filter: brightness(1.03);
          z-index: 2;
        }
        .shadow-glow-lg {
          box-shadow: 0 2px 20px 2px #19875444, 0 2px 8px 0 #6f42c122 !important;
          filter: brightness(1.03);
        }
      `}</style>
    </div>
  );
};

export default EmployeeLeaveStatus;
