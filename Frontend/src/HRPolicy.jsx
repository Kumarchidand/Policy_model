import { useEffect, useState } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const HRPolicy = ({ permissions }) => {
  const [eligibleEmployees, setEligibleEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortAsc, setSortAsc] = useState(true);

  const itemsPerPage = 10;

  const hasAccess = (code) => {
    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role;
    if (role === "admin") return true;
    return permissions?.some((p) => p.code === code && p.access);
  };

  useEffect(() => {
    axios
      .get("http://localhost:1000/api/special-increments")
      .then((res) => {
        setEligibleEmployees(res.data);
        setFilteredEmployees(res.data);
      })
      .catch((err) => console.error("Error fetching eligible employees", err));
  }, []);

  useEffect(() => {
    const filtered = eligibleEmployees.filter((emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmployees(filtered);
    setCurrentPage(1);
  }, [searchTerm, eligibleEmployees]);

  const handleSortByName = () => {
    const sorted = [...filteredEmployees].sort((a, b) => {
      return sortAsc
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    });
    setFilteredEmployees(sorted);
    setSortAsc(!sortAsc);
  };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="container py-4">
      <div className="bg-white shadow rounded p-4">
        <h3 className="mb-4 fw-bold text-primary">
          Employees Eligible for Special Increments
        </h3>

        {hasAccess("HR-View") ? (
          <>
            {/* Search */}
            <input
              type="text"
              className="form-control mb-3"
              placeholder="🔍 Search employee by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Table */}
            <div className="table-responsive">
              <table className="table table-striped table-hover border">
                <thead className="table-primary">
                  <tr>
                    <th>#</th>
                    <th
                      style={{ cursor: "pointer" }}
                      onClick={handleSortByName}
                      title="Click to sort by name"
                    >
                      Name {sortAsc ? "▲" : "▼"}
                    </th>
                    <th>Date of Joining</th>
                    <th>Years of Service</th>
                    <th>Eligible For</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-3 text-muted">
                        No eligible employees found.
                      </td>
                    </tr>
                  ) : (
                    currentEmployees.map((emp, index) => (
                      <tr key={emp._id}>
                        <td>{indexOfFirst + index + 1}</td>
                        <td>{emp.name}</td>
                        <td>
                          {new Date(emp.date_of_joining).toLocaleDateString()}
                        </td>
                        <td>{emp.years} Years</td>
                        <td>{emp.milestone}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <small className="text-muted">
                Showing page {currentPage} of {totalPages}
              </small>
              <div>
                <button
                  className="btn btn-sm btn-outline-secondary me-1"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  title="Previous"
                >
                  <FaChevronLeft />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    className={`btn btn-sm mx-1 ${
                      currentPage === i + 1
                        ? "btn-primary"
                        : "btn-outline-secondary"
                    }`}
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="btn btn-sm btn-outline-secondary ms-1"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  title="Next"
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="alert alert-danger mt-4">
            ❌ You do not have permission to view HR policy data.
          </div>
        )}
      </div>
    </div>
  );
};

HRPolicy.propTypes = {
  permissions: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      access: PropTypes.bool.isRequired,
    })
  ).isRequired,
};

export default HRPolicy;
