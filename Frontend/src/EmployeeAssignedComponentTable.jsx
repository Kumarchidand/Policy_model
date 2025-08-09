import { useState, useEffect } from "react";
import axios from "axios";

// Fetch employee list
const fetchEmployees = async () => {
  try {
    const { data } = await axios.get("http://localhost:1000/employees");
    return data.employees || data || [];
  } catch (error) {
    console.error("Failed to fetch employees:", error);
    return [];
  }
};

// Fetch component options
const fetchSalaryComponents = async () => {
  try {
    const { data } = await axios.get("http://localhost:1000/salary-components");
    return data.components || data || [];
  } catch (error) {
    console.error("Failed to fetch salary components:", error);
    return [];
  }
};

// Calculate amount for each row
const calculateAmount = (row, compPolicy, currentRows) => {
  if (!compPolicy) return 0;
  let newAmount = 0;

  if (row.type === "flat") {
    newAmount = parseFloat(row.value) || 0;
  } else if (row.type === "percentage") {
    let baseAmount = 0;

    if (row.base && row.base.length) {
      row.base.forEach(baseComp => {
        const baseRow = currentRows.find(r => r.component === baseComp);
        if (baseRow) baseAmount += parseFloat(baseRow.amount) || 0;
      });
    } else {
      const basic = currentRows.find(r => r.component === "BASIC SALARY");
      baseAmount = basic ? parseFloat(basic.amount) || 0 : 0;
    }

    const percentVal = parseFloat(row.value) || 0;
    newAmount = (baseAmount * percentVal) / 100;
  }

  return parseFloat(newAmount.toFixed(2));
};

const EmployeeAssignedComponentTable = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [componentOptions, setComponentOptions] = useState([]);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch employees
  useEffect(() => {
    fetchEmployees().then(setEmployees);
  }, []);

  // Fetch salary components
  useEffect(() => {
    fetchSalaryComponents().then(setComponentOptions);
  }, []);

  // Fetch assigned components when employee or component list changes
  useEffect(() => {
    if (!selectedEmpId || componentOptions.length === 0) {
      setRows([]);
      return;
    }

    const fetchAssigned = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(
          `http://localhost:1000/salary-components-assigned/${selectedEmpId}`
        );

        if (res.data?.components?.length > 0) {
          setRows(res.data.components.map(component => ({
            component: component.name,
            type: component.type,
            value: component.type === 'flat' ? component.value : component.percent,
            amount: component.amount,
            base: component.base || [],
            category: component.isDeduction ? 'deduction' : 'earning'
          })));
        } else {
          const initialRows = componentOptions.map(comp => ({
            component: comp.name,
            type: comp.defaultType || "flat",
            value: comp.defaultValue?.toString() || "",
            amount: 0,
            base: comp.base || [],
            category: comp.category || comp.type || "earning",
          }));

          const calculated = initialRows.map(row => {
            const compPolicy = componentOptions.find(c => c.name === row.component);
            return { ...row, amount: calculateAmount(row, compPolicy, initialRows) };
          });

          setRows(calculated);
        }
      } catch (err) {
        console.error("Failed to fetch assigned components:", err);
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssigned();
  }, [selectedEmpId, componentOptions]);

  // Handle input change
  const handleChange = (idx, field, value) => {
    const updatedRows = [...rows];
    let newRow = { ...updatedRows[idx] };

    if (field === "value" && value !== "") {
      if (!/^\d*\.?\d*$/.test(value)) return;
    }

    newRow[field] = value;

    const compPolicy = componentOptions.find(c => c.name === newRow.component);

    if (field === "component" && compPolicy) {
      newRow = {
        ...newRow,
        type: compPolicy.defaultType || "flat",
        value: compPolicy.defaultValue?.toString() || "",
        base: compPolicy.base || [],
        category: compPolicy.category || compPolicy.type || "earning",
      };
    }

    if (field === "type" && compPolicy) {
      newRow.value = compPolicy.defaultValue?.toString() || "";
    }

    // Update the current row first
    updatedRows[idx] = {
      ...newRow,
      amount: calculateAmount(newRow, compPolicy, updatedRows),
    };

    // Then recalculate all dependent rows
    const recalculatedRows = updatedRows.map(row => {
      const comp = componentOptions.find(c => c.name === row.component);
      return {
        ...row,
        amount: calculateAmount(row, comp, updatedRows),
      };
    });

    setRows(recalculatedRows);
  };

  const handleDeleteRow = idx => {
    if (rows[idx].component === "BASIC SALARY") {
      alert("Cannot delete BASIC SALARY component");
      return;
    }
    setRows(rows.filter((_, i) => i !== idx));
  };

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        component: "",
        type: "flat",
        value: "",
        amount: 0,
        base: [],
        category: "earning",
      },
    ]);
  };

  const handleSave = async () => {
    if (!selectedEmpId) {
      alert("Please select an employee first.");
      return;
    }
  
    try {
      setIsLoading(true);
      
      // Prepare components array
      const components = rows
        .filter(r => r.component.trim() !== "")
        .map(row => ({
          name: row.component,
          type: row.type,
          value: row.type === 'flat' ? Number(row.value) : undefined,
          percent: row.type === 'percentage' ? Number(row.value) : undefined,
          amount: Number(row.amount),
          base: row.base || [],
          isDeduction: row.category === 'deduction'
        }));
  
      // Calculate salary values
      const basicSalary = components.find(c => c.name === "BASIC SALARY")?.amount || 0;
      const grossSalary = components
        .filter(c => !c.isDeduction)
        .reduce((sum, c) => sum + c.amount, 0);
      const netSalary = grossSalary - components
        .filter(c => c.isDeduction)
        .reduce((sum, c) => sum + c.amount, 0);
  
      const payload = {
        components,
        basicSalary,
        grossSalary,
        netSalary
      };
  
      console.log("Sending payload:", payload); // Debug log
  
      const response = await axios.post(
        `http://localhost:1000/salary-components-assigned/${selectedEmpId}`,
        payload
      );
  
      alert(response.data.message || "Components saved successfully!");
    } catch (error) {
      console.error("Error saving components:", error);
      alert(`Failed to save components: ${
        error.response?.data?.error || 
        error.response?.data?.details || 
        error.message
      }`);
    } finally {
      setIsLoading(false);
    }
  };

  const grossSalary = rows
    .filter(r => r.category === "earning")
    .reduce((sum, r) => sum + (r.amount || 0), 0) -
    rows
      .filter(r => r.category === "deduction")
      .reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div className="container my-4">
      <h2 className="mb-4">Employee Assigned Components</h2>

      <div className="mb-3">
        <label htmlFor="employeeSelect" className="form-label">
          Select Employee:
        </label>
        <select
          id="employeeSelect"
          className="form-select"
          value={selectedEmpId}
          onChange={e => setSelectedEmpId(e.target.value)}
          disabled={isLoading}
        >
          <option value="">-- Select Employee --</option>
          {employees.map(emp => (
            <option key={emp._id} value={emp._id}>
              {emp.name} {emp.role ? `(${emp.role})` : ""}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center my-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Component</th>
                <th>Type</th>
                <th>Value / %</th>
                <th>Amount (₹)</th>
                <th>Category</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={`${row.component}-${idx}`}>
                  <td>
                    <select
                      className="form-select"
                      value={row.component}
                      onChange={e => handleChange(idx, "component", e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="">-- Select Component --</option>
                      {componentOptions.map(comp => (
                        <option key={comp._id || comp.name} value={comp.name}>
                          {comp.name} ({comp.category || comp.type || "earning"})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="form-select"
                      value={row.type}
                      onChange={e => handleChange(idx, "type", e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="flat">Flat</option>
                      <option value="percentage">Percentage</option>
                    </select>
                  </td>
                  <td>
                    {row.type === "flat" ? (
                      <input
                        type="number"
                        className="form-control"
                        value={row.value}
                        onChange={e => handleChange(idx, "value", e.target.value)}
                        placeholder="Enter flat amount"
                        step="0.01"
                        disabled={isLoading}
                      />
                    ) : (
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control"
                          value={row.value}
                          onChange={e => handleChange(idx, "value", e.target.value)}
                          placeholder="Percentage"
                          step="0.01"
                          disabled={isLoading}
                        />
                        <span className="input-group-text">%</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <strong>{row.amount.toLocaleString("en-IN")}</strong>
                  </td>
                  <td>{row.category}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteRow(idx)}
                      disabled={row.component === "BASIC SALARY" || isLoading}
                      title={row.component === "BASIC SALARY" ? "Cannot remove BASIC SALARY" : ""}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={3}>
                  <b>Gross Salary</b>
                </td>
                <td colSpan={3}>
                  <b>₹ {grossSalary.toLocaleString("en-IN")}</b>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="d-flex gap-2">
            <button 
              className="btn btn-secondary" 
              onClick={handleAddRow}
              disabled={isLoading}
            >
              + Add Custom Component
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeeAssignedComponentTable;