import { useEffect, useState } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Salary = ({ permissions }) => {
  const [salaryData, setSalaryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  const hasAccess = (code) => {
    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role?.toLowerCase();
    if (role === "admin") return true;
    return permissions?.some((p) => p.code === code && p.access);
  };

  useEffect(() => {
    const fetchSalaryData = async () => {
      try {
        const res = await axios.get("http://localhost:1000/api/salary-increments");
        const sortedData = res.data.sort((a, b) => a.name.localeCompare(b.name));

        const enrichedData = await Promise.all(
          sortedData.map(async (item) => {
            try {
              const slipRes = await axios.get("http://localhost:1000/generate-salary-slip", {
                params: {
                  employeeId: item.employeeId || item._id,
                  month: "August",
                  year: "2025",
                },
              });

              const slip = slipRes.data;

              return {
                ...item,
                paidLeaves: slip.paidLeaves || 0,
                unpaidLeaves: slip.unpaidLeaves || 0,
                totalDeduction: slip.deductionAmount || 0,
                netSalary: slip.netSalary || 0,
              };
            } catch (err) {
              console.error("Slip fetch failed for", item.name, err);
              return {
                ...item,
                paidLeaves: 0,
                unpaidLeaves: 0,
                totalDeduction: 0,
                netSalary: item.gross_new_salary || item.current_salary,
              };
            }
          })
        );

        setSalaryData(enrichedData);
        setFilteredData(enrichedData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching salary data:", err);
        setLoading(false);
      }
    };

    fetchSalaryData();
  }, []);

  useEffect(() => {
    const filtered = salaryData.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, salaryData]);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="container py-4">
      <div className="bg-white shadow rounded p-4">
        <h3 className="mb-4 fw-bold text-primary">Salary Increment Table</h3>

        {hasAccess("SALARY-View") ? (
          <>
            {/* Search Bar */}
            <input
              type="text"
              placeholder="🔍 Search by name..."
              className="form-control mb-3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Salary Table */}
            <div className="table-responsive">
              <table className="table table-striped table-hover border">
                <thead className="table-primary">
                  <tr>
                    <th>Name</th>
                    <th>Level</th>
                    <th>Experience</th>
                    <th>Current Salary</th>
                    <th>Avg Rating</th>
                    <th>Performance</th>
                    <th>Special %</th>
                    <th>Total %</th>
                    <th>Gross Salary</th>
                    <th>Paid Leaves</th>
                    <th>Unpaid Leaves</th>
                    <th>Deductions</th>
                    <th>Net Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="13" className="text-center py-3">
                        Loading...
                      </td>
                    </tr>
                  ) : paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan="13" className="text-center text-muted py-3">
                        No matching records
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>{item.level}</td>
                        <td>{item.experience}</td>
                        <td>₹{item.current_salary?.toLocaleString()}</td>
                        <td>{item.avg_rating}</td>
                        <td>{item.rating_label}</td>
                        <td>{item.special_increment}%</td>
                        <td>{item.total_increment}%</td>
                        <td>₹{item.gross_new_salary?.toLocaleString()}</td>
                        <td>{item.paidLeaves}</td>
                        <td className="text-danger">{item.unpaidLeaves}</td>
                        <td className="text-danger">
                          -₹{item.totalDeduction?.toLocaleString()}
                        </td>
                        <td className="fw-bold text-success">
                          ₹{item.netSalary?.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <FaChevronLeft />
                </button>

                <div>
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
                </div>

                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <FaChevronRight />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="alert alert-danger mt-3">
            ❌ You do not have permission to view salary data.
          </div>
        )}
      </div>
    </div>
  );
};

Salary.propTypes = {
  permissions: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      access: PropTypes.bool.isRequired,
    })
  ).isRequired,
};

export default Salary;
