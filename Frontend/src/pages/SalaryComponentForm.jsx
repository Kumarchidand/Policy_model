import { useState, useEffect } from "react";
import axios from "axios";

const SalaryComponentForm = () => {
  const [components, setComponents] = useState([{ name: "", type: "earning" }]);
  const [loading, setLoading] = useState(true);

  // Fetch saved components on mount
  useEffect(() => {
    const fetchComponents = async () => {
      try {
        const res = await axios.get("http://localhost:1000/salary-components");
        if (res.data?.components?.length > 0) {
          setComponents(res.data.components);
        }
      } catch (error) {
        console.error("Error fetching components:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComponents();
  }, []);

  // Handle input field change
  const handleChange = (index, field, value) => {
    const newComponents = [...components];
    newComponents[index][field] = value;
    setComponents(newComponents);
  };

  // Add new component
  const handleAdd = () => {
    setComponents([...components, { name: "", type: "earning" }]);
  };

  // Remove component
  const handleRemove = (index) => {
    const newComponents = [...components];
    newComponents.splice(index, 1);
    setComponents(newComponents);
  };

  // Save components
  const handleSave = async () => {
    try {
      await axios.post("http://localhost:1000/salary-components", {
        components,
      });
      alert("Components saved successfully!");
    } catch (error) {
      console.error("Error saving components:", error);
      alert("Error while saving.");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="container py-4">
      <h2 className="mb-4">Salary Components</h2>

      <table className="table table-bordered">
        <thead className="table-light">
          <tr>
            <th style={{ width: "60%" }}>Component Name</th>
            <th style={{ width: "30%" }}>Type</th>
            <th style={{ width: "10%" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {components.map((comp, index) => (
            <tr key={index}>
              <td>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Basic, HRA, PF"
                  value={comp.name}
                  onChange={(e) => handleChange(index, "name", e.target.value)}
                />
              </td>
              <td>
                <select
                  className="form-select"
                  value={comp.type}
                  onChange={(e) => handleChange(index, "type", e.target.value)}
                >
                  <option value="earning">Earning</option>
                  <option value="deduction">Deduction</option>
                </select>
              </td>
              <td>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => handleRemove(index)}
                  disabled={components.length === 1}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="d-flex mt-3 gap-2">
        <button className="btn btn-secondary" onClick={handleAdd}>
          + Add Component
        </button>
        <button className="btn btn-primary" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
};

export default SalaryComponentForm;
