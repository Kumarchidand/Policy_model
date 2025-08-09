import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const HR1 = () => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch policy on mount
  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const res = await axios.get("http://localhost:1000/hr-policy2");
        if (res.data?.leaveTypes) {
          // Normalize leaveTypes to ensure allowedAfterLimit field exists
          const normalized = res.data.leaveTypes.map((lt) => ({
            ...lt,
            allowedAfterLimit: lt.allowedAfterLimit ?? false,
          }));
          setLeaveTypes(normalized);
        } else {
          setLeaveTypes([]);
        }
      } catch (err) {
        console.error("Error fetching policy:", err);
        setLeaveTypes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolicy();
  }, []);

  // Handle updates to leaveType fields including the checkbox
  const handleLeaveChange = (index, field, value) => {
    const updated = [...leaveTypes];
    updated[index][field] = value;
    setLeaveTypes(updated);
  };

  // Add a new leave type row
  const addLeaveType = () => {
    setLeaveTypes([
      ...leaveTypes,
      {
        type: "",
        mode: "Free",
        frequency: "Monthly",
        maxPerRequest: 1,
        normalDays: 1,
        allowedAfterLimit: false, // default unchecked for new leave types
      },
    ]);
  };

  // Remove a leave type row
  const removeLeaveType = (index) => {
    setLeaveTypes(leaveTypes.filter((_, i) => i !== index));
  };

  // Save the policy to backend
  const savePolicy = async () => {
    try {
      await axios.post("http://localhost:1000/hr-policy2", {
        leaveTypes,
      });
      alert("Policy saved successfully");
    } catch (err) {
      console.error("Error saving policy:", err);
      alert("Failed to save policy");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Leave Policy Criteria</h2>

      {isLoading ? (
        <p>Loading policy...</p>
      ) : (
        <>
          <h4 className="mt-4"></h4>
          <table className="table table-bordered align-middle">
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Mode</th>
                <th>Frequency</th>
                <th>Max Days Per Request</th>
                <th>Total Days (Yearly)</th>
                <th className="text-center">Allowed After Limit</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {leaveTypes.length > 0 ? (
                leaveTypes.map((leave, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        value={leave.type}
                        onChange={(e) =>
                          handleLeaveChange(index, "type", e.target.value)
                        }
                        placeholder="Leave Type"
                      />
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={leave.mode}
                        onChange={(e) =>
                          handleLeaveChange(index, "mode", e.target.value)
                        }
                      >
                        <option value="Free">Free</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={leave.frequency}
                        onChange={(e) =>
                          handleLeaveChange(index, "frequency", e.target.value)
                        }
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Yearly">Yearly</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        className="form-control"
                        value={leave.maxPerRequest}
                        onChange={(e) =>
                          handleLeaveChange(
                            index,
                            "maxPerRequest",
                            Number(e.target.value)
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        className="form-control"
                        value={leave.normalDays}
                        onChange={(e) =>
                          handleLeaveChange(
                            index,
                            "normalDays",
                            Number(e.target.value)
                          )
                        }
                      />
                    </td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={leave.allowedAfterLimit || false}
                        onChange={(e) =>
                          handleLeaveChange(
                            index,
                            "allowedAfterLimit",
                            e.target.checked
                          )
                        }
                        aria-label={`Allowed After Limit for leave type ${leave.type}`}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => removeLeaveType(index)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center text-muted">
                    No leave types defined.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={addLeaveType}
            >
              Add Leave Type
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={savePolicy}
            >
              Save
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default HR1;
