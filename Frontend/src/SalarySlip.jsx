import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaCalendarAlt,
  FaFileInvoiceDollar,
  FaMoneyBillWave,
  FaRupeeSign,
  FaCheckCircle,
  FaTimesCircle,
  FaMinusCircle,
  FaPrint,
  FaSave,
  FaDownload,
  FaSearch,
  FaUser,
} from "react-icons/fa";

const SalarySlip = () => {
  const currentYear = new Date().getFullYear();
  const [salarySlips, setSalarySlips] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("08"); // August default
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const months = {
    "01": "January",
    "02": "February",
    "03": "March",
    "04": "April",
    "05": "May",
    "06": "June",
    "07": "July",
    "08": "August",
    "09": "September",
    "10": "October",
    "11": "November",
    "12": "December",
  };

  const years = Array.from({ length: 10 }, (_, i) =>
    (currentYear - i).toString()
  );

  const fetchSalarySlips = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:1000/employees");
      const employees = res.data;
      const salaryData = [];

      for (let emp of employees) {
        try {
          const slipRes = await axios.get(
            "http://localhost:1000/generate-salary-slip",
            {
              params: {
                employeeId: emp._id,
                month: selectedMonth,
                year: selectedYear,
              },
            }
          );
          const slip = slipRes.data;

          salaryData.push({
            employeeName: slip.employeeName || emp.name,
            employeeId: slip.employeeId || emp._id,
            grossSalary: slip.grossSalary ?? 0,
            netSalary: slip.netSalary ?? 0,
            paidLeaves: slip.paidLeaves ?? 0,
            unpaidLeaves: slip.unpaidLeaves ?? 0,
            deductionAmount: slip.deductionAmount ?? 0,
            totalWorkingDays: slip.totalWorkingDays ?? 0,
            presentDays:
              slip.presentDays ?? (slip.totalWorkingDays ?? 0) - (slip.unpaidLeaves ?? 0),
          });
        } catch (err) {
          console.error(`Error fetching slip for ${emp.name}`, err);
        }
      }
      setSalarySlips(salaryData);
    } catch (err) {
      console.error("Failed to fetch employees", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSalarySlips();
  }, [selectedMonth, selectedYear]);

  const handleDownload = async (empId) => {
    try {
      const res = await axios.get("http://localhost:1000/salary-slip/download", {
        params: {
          employeeId: empId,
          month: selectedMonth,
          year: selectedYear,
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `SalarySlip-${empId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to download PDF", err);
    }
  };

  const filteredSlips = salarySlips.filter(
    (slip) =>
      slip.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slip.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container py-3">
      {/* Main Card */}
      <div className="card shadow-lg border-0 rounded-3">
        <div className="card-header bg-info text-white p-4 d-flex justify-content-between align-items-center flex-wrap">
          <h2 className="fw-bold m-0 d-flex align-items-center gap-2">
            <FaFileInvoiceDollar />
            Salary Slips
          </h2>
          <div className="d-flex align-items-center gap-3">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <FaSearch className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by name or ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="card-body">
          {/* Filters and Current Period */}
          <div className="row mb-4 align-items-center g-3">
            <div className="col-md-6 col-lg-4">
              <div className="d-flex align-items-center gap-2">
                <FaCalendarAlt className="fs-4 text-primary" />
                <h5 className="text-secondary fw-semibold m-0">
                  {months[selectedMonth]} {selectedYear}
                </h5>
              </div>
            </div>
            <div className="col-md-6 col-lg-8">
              <div className="d-flex gap-3 justify-content-md-end flex-wrap">
                <div style={{ minWidth: "150px" }}>
                  <label className="form-label fw-semibold">Select Month</label>
                  <select
                    className="form-select"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    {Object.entries(months).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ minWidth: "120px" }}>
                  <label className="form-label fw-semibold">Select Year</label>
                  <select
                    className="form-select"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="table table-bordered table-striped table-hover rounded-3 overflow-hidden">
              <thead className="table-dark text-center align-middle">
                <tr>
                  <th>
                    <FaUser /> Name
                  </th>
                  <th>
                    <FaMoneyBillWave /> Gross Salary
                  </th>
                  <th>
                    <FaRupeeSign /> Net Salary
                  </th>
                  <th>Working Days</th>
                  <th>Present Days</th>
                  <th>
                    <FaCheckCircle /> Paid Leaves
                  </th>
                  <th>
                    <FaTimesCircle /> Unpaid Leaves
                  </th>
                  <th>
                    <FaMinusCircle /> Deduction
                  </th>
                  <th>Download</th>
                </tr>
              </thead>
              <tbody className="text-center align-middle">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-4 text-muted">
                      Loading salary slips...
                    </td>
                  </tr>
                ) : filteredSlips.length > 0 ? (
                  filteredSlips.map((slip, idx) => (
                    <tr key={idx}>
                      <td className="h6">{slip.employeeName}</td>
                      <td>
                        ₹
                        {slip.grossSalary != null
                          ? slip.grossSalary.toFixed(2)
                          : "0.00"}
                      </td>
                      <td>
                        ₹
                        {slip.netSalary != null
                          ? slip.netSalary.toFixed(2)
                          : "0.00"}
                      </td>
                      <td>{slip.totalWorkingDays}</td>
                      <td>{slip.presentDays}</td>
                      <td>{slip.paidLeaves}</td>
                      <td>{slip.unpaidLeaves}</td>
                      <td>
                        ₹
                        {slip.deductionAmount != null
                          ? slip.deductionAmount.toFixed(2)
                          : "0.00"}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleDownload(slip.employeeId)}
                          aria-label={`Download salary slip for ${slip.employeeName}`}
                        >
                          <FaDownload />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center py-4 text-muted">
                      No salary slips found for the selected period or matching your
                      search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="d-flex justify-content-center gap-3 mt-4 flex-wrap">
        <button
          className="btn btn-outline-dark d-flex align-items-center"
          onClick={() => window.print()}
        >
          <FaPrint className="me-2" />
          Print All
        </button>

        <button
          className="btn btn-success d-flex align-items-center"
          onClick={async () => {
            try {
              const payload = {
                month: selectedMonth,
                year: selectedYear,
                slips: salarySlips,
              };
              await axios.post("http://localhost:1000/salary-slip/save-all", payload);
              alert("Salary slips saved successfully!");
            } catch (err) {
              console.error("Error saving slips", err);
              alert("Failed to save salary slips");
            }
          }}
        >
          <FaSave className="me-2" />
          Save All
        </button>
      </div>
    </div>
  );
};

export default SalarySlip;
