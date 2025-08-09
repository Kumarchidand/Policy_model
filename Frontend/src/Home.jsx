import { useEffect, useState } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import "bootstrap/dist/css/bootstrap.min.css";

const Home = ({ permissions }) => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("asc");
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  const employeesPerPage = 10;

  const hasAccess = (code) => {
    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role?.toLowerCase();
    if (role === "admin") return true;
    return permissions?.some((p) => p.code === code && p.access);
  };

  useEffect(() => {
    axios
      .get("http://localhost:1000/employees")
      .then((res) => setEmployees(res.data))
      .catch((err) => console.error("Fetch error:", err));
  }, [refreshKey]);

  const filteredEmployees = employees
    .filter((e) =>
      Object.values({
        name: e.name,
        email: e.email,
        phone: e.phone,
        address: e.address,
        date_of_joining: new Date(e.date_of_joining).toLocaleDateString(),
        salary: e.salary?.toString(),
      })
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )

    .sort((a, b) =>
      sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );

  const indexOfLast = currentPage * employeesPerPage;
  const indexOfFirst = indexOfLast - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);

  const handleEdit = (emp) => {
    setEditId(emp._id);
    setEditData({ ...emp });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditCancel = () => {
    setEditId(null);
    setEditData({});
  };

  const handleEditSave = async () => {
    try {
      await axios.put(`http://localhost:1000/employees/${editId}`, editData);
      setEditId(null);
      setEditData({});
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      alert("Failed to update employee.", err);
    }
  };

  return (
    <div className="p-4 bg-light overflow-auto">
      <h2 className="mb-4">Employee Register Table</h2>

      {hasAccess("HOME-View") ? (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <input
              type="text"
              className="form-control w-50"
              placeholder="🔍 Search by name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            <button
              className="btn btn-secondary ms-3"
              onClick={() =>
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
            >
              Sort by Name ({sortOrder === "asc" ? "A-Z" : "Z-A"})
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Date of Joining</th>
                  <th>Salary</th>
                  {(hasAccess("E-Edit") || hasAccess("E-Delete")) && (
                    <th>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {currentEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center">
                      No records found
                    </td>
                  </tr>
                ) : (
                  currentEmployees.map((emp, idx) => (
                    <tr key={emp._id}>
                      <td>{indexOfFirst + idx + 1}</td>

                      {editId === emp._id ? (
                        <>
                          <td>
                            <input
                              className="form-control form-control-sm"
                              name="name"
                              value={editData.name}
                              onChange={handleEditChange}
                            />
                          </td>
                          <td>
                            <input
                              className="form-control form-control-sm"
                              name="email"
                              value={editData.email}
                              onChange={handleEditChange}
                            />
                          </td>
                          <td>
                            <input
                              className="form-control form-control-sm"
                              name="phone"
                              value={editData.phone}
                              onChange={handleEditChange}
                            />
                          </td>
                          <td>
                            <input
                              className="form-control form-control-sm"
                              name="address"
                              value={editData.address}
                              onChange={handleEditChange}
                            />
                          </td>
                          <td>
                            <input
                              className="form-control form-control-sm"
                              name="date_of_joining"
                              type="date"
                              value={
                                editData.date_of_joining
                                  ? editData.date_of_joining.slice(0, 10)
                                  : ""
                              }
                              onChange={handleEditChange}
                            />
                          </td>
                          <td>
                            <input
                              className="form-control form-control-sm"
                              name="salary"
                              type="number"
                              value={editData.salary}
                              onChange={handleEditChange}
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{emp.name}</td>
                          <td>{emp.email}</td>
                          <td>{emp.phone}</td>
                          <td>{emp.address}</td>
                          <td>
                            {new Date(emp.date_of_joining).toLocaleDateString()}
                          </td>
                          <td>₹{emp.salary}</td>
                        </>
                      )}

                      {(hasAccess("E-Edit") || hasAccess("E-Delete")) && (
                        <td>
                          {hasAccess("E-Edit") &&
                            (editId === emp._id ? (
                              <>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={handleEditSave}
                                >
                                  Save
                                </button>
                                <button
                                  className="btn btn-sm btn-secondary"
                                  onClick={handleEditCancel}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                className="btn btn-sm btn-primary me-2"
                                onClick={() => handleEdit(emp)}
                              >
                                Edit
                              </button>
                            ))}
                          {hasAccess("E-Delete") && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() =>
                                alert(`⚠️ Deletion not implemented yet.`)
                              }
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      )}
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
                className="btn btn-outline-secondary"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                ⬅ Prev
              </button>
              <span className="fw-bold">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="btn btn-outline-secondary"
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next ➡
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="alert alert-danger">
          ❌ You do not have permission to view this page.
        </div>
      )}
    </div>
  );
};

Home.propTypes = {
  permissions: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      access: PropTypes.bool.isRequired,
    })
  ),
};

Home.defaultProps = {
  permissions: [],
};

export default Home;
