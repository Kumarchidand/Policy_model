import { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css"; // Ensure icons loaded

const HRApprovalPage = () => {
  const [leaves, setLeaves] = useState([]);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // "Approved" or "Rejected"
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [hrMessage, setHrMessage] = useState("");
  const [modalFromDate, setModalFromDate] = useState("");
  const [modalToDate, setModalToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const fetchData = async () => {
    try {
      const res = await axios.get("http://localhost:1000/leaves");
      setLeaves(res.data.reverse());
    } catch (err) {
      setMessage("❌ Failed to fetch leave data.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "...";
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const base = "badge rounded-pill px-3 py-2 fw-semibold text-uppercase";
    if (status === "Approved") return <span className={`${base} bg-success`}>Approved</span>;
    if (status === "Rejected") return <span className={`${base} bg-danger`}>Rejected</span>;
    return <span className={`${base} bg-warning text-dark`}>Pending</span>;
  };

  const openModal = (leave, type) => {
    setSelectedLeave(leave);
    setModalType(type);

    if (type === "Approved") {
      setHrMessage("Enjoy your leave!");
      setModalFromDate(leave.approvedFromDate?.slice(0, 10) || leave.fromDate?.slice(0, 10) || "");
      setModalToDate(leave.approvedToDate?.slice(0, 10) || leave.toDate?.slice(0, 10) || "");
    } else {
      setHrMessage(leave.message || leave.eligibilityWarning || "Request denied");
      setModalFromDate("");
      setModalToDate("");
    }

    setShowModal(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLeave) return;

    try {
      const payload = {
        status: modalType,
        message: hrMessage,
        ...(modalType === "Approved" && {
          fromDate: modalFromDate,
          toDate: modalToDate,
        }),
      };

      await axios.put(`http://localhost:1000/leaves/status/${selectedLeave._id}`, payload);
      setMessage(`✅ Leave ${modalType.toLowerCase()} successfully.`);
      setShowModal(false);
      fetchData();
    } catch (err) {
      setMessage("❌ Update failed: " + (err.response?.data?.message || err.message));
      setShowModal(false);
    }
  };

  const totalPages = Math.ceil(leaves.length / itemsPerPage);
  const paginatedLeaves = leaves.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="container py-5">
      <div className="card shadow border-0">
        <div className="card-body">
          <h3 className="mb-4 text-primary d-flex align-items-center flex-wrap">
            <i className="bi bi-journal-check me-2"></i> HR Leave Accepted Panel
          </h3>

          {message && (
            <div
              className={`alert ${message.includes("❌") ? "alert-danger" : "alert-success"}`}
              role="alert"
            >
              {message}
            </div>
          )}

          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle text-center">
              <thead className="table-light">
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Applied Dates</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Eligibility</th>
                  <th>Status</th>
                  <th style={{ minWidth: "110px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeaves.length ? (
                  paginatedLeaves.map((leave) => (
                    <tr key={leave._id} className={leave.eligibilityWarning ? "table-warning" : ""}>
                      <td className="text-wrap">{leave.employeeId?.name || leave.employeeName || "N/A"}</td>
                      <td className="text-wrap">{leave.leaveType}</td>
                      <td className="text-nowrap">
                        {leave.fromDate && leave.toDate
                          ? `${formatDate(leave.fromDate)} - ${formatDate(leave.toDate)}`
                          : "-"}
                      </td>
                      <td>{leave.totalDays}</td>
                      <td
                        className="text-truncate"
                        style={{ maxWidth: "200px" }}
                        title={leave.reason}
                      >
                        {leave.reason || "..."}
                      </td>
                      <td>
                        {leave.eligibilityWarning ? (
                          <span className="badge bg-warning text-dark">{leave.eligibilityWarning}</span>
                        ) : (
                          <span className="badge bg-primary-subtle text-primary-emphasis border border-primary-subtle">
                            ✔ Eligible
                          </span>
                        )}
                      </td>
                      <td>{getStatusBadge(leave.status)}</td>
                      <td>
                        <div className="d-flex gap-2 justify-content-center flex-wrap">
                          <button
                            className="btn btn-sm btn-outline-success"
                            disabled={leave.status === "Approved"}
                            onClick={() => openModal(leave, "Approved")}
                            title="Approve"
                          >
                            <i className="bi bi-check2-circle"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            disabled={["Approved", "Rejected"].includes(leave.status)}
                            onClick={() => openModal(leave, "Rejected")}
                            title="Reject"
                          >
                            <i className="bi bi-x-circle"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-muted py-3">
                      No leave requests available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {leaves.length > itemsPerPage && (
            <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
              <div className="text-muted small">
                Showing{" "}
                {Math.min((currentPage - 1) * itemsPerPage + 1, leaves.length)}–{" "}
                {Math.min(currentPage * itemsPerPage, leaves.length)} of {leaves.length}
              </div>
              <ul className="pagination mb-0 flex-wrap">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage - 1)}
                    aria-label="Previous"
                  >
                    Previous
                  </button>
                </li>
                {[...Array(totalPages)].map((_, i) => (
                  <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(i + 1)}
                      aria-label={`Page ${i + 1}`}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage + 1)}
                    aria-label="Next"
                  >
                    Next
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
          onClick={() => setShowModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <form onSubmit={handleModalSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {modalType === "Approved" ? "Approve Leave" : "Reject Leave"}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close" />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Message to Employee</label>
                    <textarea
                      className="form-control"
                      required
                      value={hrMessage}
                      onChange={(e) => setHrMessage(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {modalType === "Approved" && (
                    <div className="row g-2">
                      <div className="col-12 col-md-6">
                        <label className="form-label">Approved From</label>
                        <input
                          type="date"
                          className="form-control"
                          value={modalFromDate}
                          onChange={(e) => setModalFromDate(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">Approved To</label>
                        <input
                          type="date"
                          className="form-control"
                          value={modalToDate}
                          onChange={(e) => setModalToDate(e.target.value)}
                          required
                          min={modalFromDate}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer flex-wrap gap-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {modalType === "Approved" ? "Approve" : "Reject"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRApprovalPage;
