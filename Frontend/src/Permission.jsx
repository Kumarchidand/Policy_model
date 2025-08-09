// permission page
import { useEffect, useState } from "react";
import axios from "axios";
// these are hard coded list of all possible permissions
// or we can say fix menu of permissions
const allPermissions = [
  { code: "E-Add", label: "Create new employees" },
  { code: "E-Edit", label: "Edit employee information" },
  { code: "E-Delete", label: "Delete employee" },
  { code: "T-Add", label: "Create new tasks" },
  // { code: "T-Edit", label: "Edit existing tasks" },
  // { code: "T-Delete", label: "Delete tasks" },
  { code: "HR-View", label: "View HR Policy" },
  { code: "SALARY-View", label: "View Salary Info" },
  { code: "TASK-View", label: "View Task Details" },
  { code: "HOME-View", label: "Access Home Page" },
];

const Permission = () => {
  const [employees, setEmployees] = useState([]); //list of all employees fetched from api

  const [selectedUserId, setSelectedUserId] = useState(""); //stores ids of currently stored employee

  const [selectedUser, setSelectedUser] = useState(null); //for full details of selected employee

  // dynamic user-specific
  const [userPermissions, setUserPermissions] = useState({}); //permissions flags for selected user in object { "E-Add": true, "E-Edit": false }

  useEffect(() => {
    axios.get("http://localhost:1000/employees").then((res) => {
      setEmployees(res.data);
    });
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      const emp = employees.find((emp) => emp._id === selectedUserId);
      setSelectedUser(emp);
      axios
        .get(`http://localhost:1000/permissions/${selectedUserId}`)
        .then((res) => {
          const perms = res.data?.operations || [];
          const mapped = {};
          perms.forEach((p) => (mapped[p.code] = p.access));
          setUserPermissions(mapped);
        });
    }
  }, [selectedUserId, employees]);

  const handleToggle = (code) => {
    setUserPermissions((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };
  const handleSave = () => {
    const payload = {
      userId: selectedUserId,
      operations: allPermissions.map((perm) => ({
        code: perm.code,
        access: userPermissions[perm.code] || false,
      })),
    };

    axios
      .post("http://localhost:1000/permissions", payload)
      .then(() => {
        alert("Permissions updated!");
        // Fetch latest permissions after save
        axios
          .get(`http://localhost:1000/permissions/${selectedUserId}`)
          .then((res) => {
            const perms = res.data?.operations || [];
            const mapped = {};
            perms.forEach((p) => (mapped[p.code] = p.access));
            setUserPermissions(mapped);
          });
      })
      .catch(() => alert("Error saving permissions"));
  };

  const grantedCount = Object.values(userPermissions).filter((a) => a).length;
  const deniedCount = allPermissions.length - grantedCount;

  return (
    <div className="container my-5">
      <h2 className="mb-4 fw-bold">🔐 Permission Management</h2>

      <div className="mb-4 p-4 border rounded bg-light">
        <h5 className="mb-3">👤 User Selection</h5>
        <label className="form-label">Select User:</label>
        <select
          className="form-select"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
        >
          <option value="">-- Select --</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.name} ({emp.role})
            </option>
          ))}
        </select>
        {selectedUser && (
          <div className="mt-3 alert alert-primary d-flex align-items-center">
            <i className="bi bi-person-fill me-2"></i>
            <strong>Selected:</strong> {selectedUser.name}{" "}
            <span className="badge bg-secondary ms-2">{selectedUser.role}</span>
          </div>
        )}
      </div>

      {/* Employee Dashboard Card */}
      {selectedUserId && selectedUser && (
        <div className="mb-4 p-4 border rounded bg-white shadow-sm">
          <h5 className="mb-2">🧑‍💼 Employee Dashboard</h5>
          <div className="mb-2">
            <strong>Name:</strong> {selectedUser.name} <br />
            <strong>ID:</strong> {selectedUser._id}
          </div>
          <div>
            <strong>Granted Permissions:</strong>
            <ul className="mt-2">
              {allPermissions.filter((perm) => userPermissions[perm.code])
                .length === 0 ? (
                <li className="text-danger">No permissions granted</li>
              ) : (
                allPermissions
                  .filter((perm) => userPermissions[perm.code])
                  .map((perm) => (
                    <li key={perm.code} className="text-success">
                      <span className="badge bg-success me-2">{perm.code}</span>
                      {perm.label}
                    </li>
                  ))
              )}
            </ul>
          </div>

          {/* Actions column for Edit/Delete if permission granted */}
          {(userPermissions["E-Edit"] || userPermissions["E-Delete"]) && (
            <div className="mt-3">
              <strong>Actions:</strong>
              {userPermissions["E-Edit"] && (
                <button
                  className="btn btn-sm btn-primary me-2"
                  onClick={() => alert(`Edit ${selectedUser.name}`)}
                >
                  Edit
                </button>
              )}
              {userPermissions["E-Delete"] && (
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => alert(`Delete ${selectedUser.name}`)}
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {selectedUserId && (
        <div className="p-4 border rounded mb-4">
          <h5 className="mb-3">🔧 Permissions</h5>
          <p className="text-muted">Toggle permissions for the selected user</p>
          {allPermissions.map((perm) => (
            <div
              className="d-flex justify-content-between align-items-center py-2 border-bottom"
              key={perm.code}
            >
              <div>
                <span className="badge bg-dark me-2">{perm.code}</span>
                {perm.label}
              </div>
              <div className="d-flex align-items-center">
                <span
                  className={`me-2 fw-semibold ${
                    userPermissions[perm.code] ? "text-success" : "text-danger"
                  }`}
                >
                  {userPermissions[perm.code] ? "Granted" : "Denied"}
                </span>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={userPermissions[perm.code] || false}
                    onChange={() => handleToggle(perm.code)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedUserId && (
        <div>
          <button className="btn btn-dark mb-3" onClick={handleSave}>
            💾 Save Permissions
          </button>

          <div className="alert alert-light border mt-3">
            <h6 className="fw-bold mb-2">Permission Summary</h6>
            <span className="text-success">
              🟢 Granted: {grantedCount}
            </span>{" "}
            <span className="text-danger ms-3">🔴 Denied: {deniedCount}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Permission;
