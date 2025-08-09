import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import axios from "axios";
import { RxDashboard } from "react-icons/rx";
import {
  FaFileInvoiceDollar,
  FaRegCalendarCheck,
  FaSignOutAlt,
  FaUserPlus,
  FaTable,
  FaTasks,
  FaShieldAlt,
  FaUserShield,
  FaCheckCircle,
  FaChartBar,
  FaLock,
  FaUserCheck,
} from "react-icons/fa";

const Navbar = ({ permissions }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role?.toLowerCase();
  const isAdmin = role === "admin";
  const isHr = role === "hr";
  const isEmp = role === "employee";

  const [pendingCount, setPendingCount] = useState(0);
  const [showPerformance, setShowPerformance] = useState(false); // Collapsible state

  const fetchPendingCount = async () => {
    try {
      const res = await axios.get("http://localhost:1000/leaves/pending/count");
      setPendingCount(res.data.pendingCount || 0);
    } catch (error) {
      setPendingCount(0);
      console.error("Error fetching pending count:", error);
    }
  };

  useEffect(() => {
    if (isHr || isAdmin) {
      fetchPendingCount();
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isHr, isAdmin]);

  const hasAccess = (code) => {
    if (isAdmin) return true;
    return permissions?.some((p) => p.code === code && p.access);
  };

  return (
    <div
      className="d-flex flex-column text-white p-4"
      style={{
        width: "260px",
        minHeight: "100vh",
        backgroundColor: "#1e1e2f",
        borderRight: "1px solid #333",
      }}
    >
      <h4 className="text-center mb-4 border-bottom pb-3 fw-bold text-info">
        <RxDashboard /> Dashboard
      </h4>

      <div className="d-grid gap-3">
        {!isAdmin && (
          <SidebarBtn
            label="Attendance Tracker"
            onClick={() => navigate("/ad")}
            icon={<FaShieldAlt />}
          />
        )}

        {isAdmin && (
          <>
            {/* Collapsible Performance Section */}
            <button
              className="d-flex align-items-center justify-content-between px-3 py-2 rounded w-100 text-start"
              style={{
                backgroundColor: "#2c2f48",
                color: "#ffffff",
                border: "none",
                fontWeight: "500",
              }}
              onClick={() => setShowPerformance(!showPerformance)}
            >
              <span className="d-flex align-items-center gap-2">
                <FaChartBar />
                Performance
              </span>
              <span>{showPerformance ? "▲" : "▼"}</span>
            </button>

            {showPerformance && (
              <div className="ms-3 mt-2 d-grid gap-2">
                <SidebarBtn
                  label="Attendance Tracker"
                  onClick={() => navigate("/ad")}
                  icon={<FaRegCalendarCheck />}
                />
             
                <SidebarBtn
                  label="Avg Rating Chart"
                  onClick={() => navigate("/avg")}
                  icon={<FaChartBar />}
                />
                <SidebarBtn
                  label="Task Details"
                  onClick={() => navigate("/taskdetail")}
                  icon={<FaTasks />}
                />
              </div>
            )}

            {/* Admin-only Other Controls */}
            <SidebarBtn
              label="Leave Policy"
              onClick={() => navigate("/policy")}
              icon={<FaShieldAlt />}
            />
            <SidebarBtn
              label="Super Admin"
              onClick={() => navigate("/superadmin")}
              icon={<FaLock />}
            />
            <SidebarBtn
              label="Employee Table"
              onClick={() => navigate("/home")}
              icon={<FaTable />}
            />
            <SidebarBtn
              label="HR Policy Table"
              onClick={() => navigate("/hr")}
              icon={<FaShieldAlt />}
            />
            <SidebarBtn
              label="Salary Increments"
              onClick={() => navigate("/salary")}
              icon={<FaTable />}
            />
            <SidebarBtn
              label="Add Employee"
              onClick={() => navigate("/add")}
              icon={<FaUserPlus />}
            />
            <SidebarBtn
              label="Permissions"
              onClick={() => navigate("/per")}
              icon={<FaUserShield />}
              highlight
            />
          </>
        )}

        {/* Non-admin permissions */}
        {!isAdmin && (
          <>
            {hasAccess("T-Add") && (
              <SidebarBtn
                label="My Task Tracker"
                onClick={() => navigate("/hrdet")}
                icon={<FaTasks />}
              />
            )}
            {hasAccess("HOME-View") && (
              <SidebarBtn
                label="Employee Table"
                onClick={() => navigate("/home")}
                icon={<FaTable />}
              />
            )}
            {hasAccess("HR-View") && (
              <SidebarBtn
                label="HR Policy Table"
                onClick={() => navigate("/hr")}
                icon={<FaShieldAlt />}
              />
            )}
            {hasAccess("SALARY-View") && (
              <SidebarBtn
                label="Salary Increments"
                onClick={() => navigate("/salary")}
                icon={<FaTable />}
              />
            )}
            {hasAccess("TASK-View") && (
              <SidebarBtn
                label="Task Details"
                onClick={() => navigate("/taskdetail")}
                icon={<FaTasks />}
              />
            )}
            {hasAccess("E-Add") && (
              <SidebarBtn
                label="Add Employee"
                onClick={() => navigate("/add")}
                icon={<FaUserPlus />}
              />
            )}
            {hasAccess("PERMISSION-MANAGE") && (
              <SidebarBtn
                label="Permissions"
                onClick={() => navigate("/per")}
                icon={<FaUserShield />}
                highlight
              />
            )}
            <SidebarBtn
              label="Employee Dashboard"
              onClick={() => navigate("/dash")}
              icon={<FaUserShield />}
            />
          </>
        )}
        {isHr&&(
             <SidebarBtn
             label="Emp assign"
             onClick={() => navigate("/table")}
             icon={<FaCheckCircle />}
           />
        )}
        {isHr &&(
             <SidebarBtn
             label="Salary Slip"
             onClick={() => navigate("/slip")}
             icon={<FaFileInvoiceDollar />}
           />
        )}

        {isEmp && (
          <SidebarBtn
            label="Leave Apply"
            onClick={() => navigate("/leave")}
            icon={<FaCheckCircle />}
          />
        )}
        {isHr && (
          <SidebarBtn
            label="Leave Status"
            onClick={() => navigate("/approve")}
            icon={<FaShieldAlt />}
            count={pendingCount}
          />
        )}
      </div>

      {/* Logout Button */}
      <div className="mt-auto pt-4 border-top border-secondary">
        <button
          className="btn w-100 fw-semibold d-flex align-items-center justify-content-center gap-2 text-white"
          style={{
            backgroundColor: "#e74c3c",
            border: "none",
            transition: "all 0.3s",
          }}
          onClick={() => {
            localStorage.clear();
            navigate("/");
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#c0392b")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#e74c3c")
          }
        >
          <FaSignOutAlt />
          Sign Out
        </button>
      </div>
    </div>
  );
};

// Sidebar Button Component
const SidebarBtn = ({ label, onClick, icon, count, highlight }) => (
  <button
    className="d-flex align-items-center gap-2 px-3 py-2 rounded w-100 text-start position-relative"
    style={{
      backgroundColor: highlight ? "#f39c12" : "#2c2f48",
      color: highlight ? "#1e1e2f" : "#ffffff",
      border: "none",
      fontWeight: "500",
      transition: "all 0.3s ease",
    }}
    onClick={onClick}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = highlight ? "#e67e22" : "#3a3d5c";
      e.currentTarget.style.boxShadow = "0 0 10px rgba(0,0,0,0.4)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = highlight ? "#f39c12" : "#2c2f48";
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    {icon}
    <span>{label}</span>
    {count > 0 && (
      <span
        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
        style={{ fontSize: "0.75rem" }}
      >
        {count}
        <span className="visually-hidden">pending requests</span>
      </span>
    )}
  </button>
);

SidebarBtn.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.node,
  count: PropTypes.number,
  highlight: PropTypes.bool,
};

SidebarBtn.defaultProps = {
  icon: null,
  count: 0,
  highlight: false,
};

Navbar.propTypes = {
  permissions: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      access: PropTypes.bool.isRequired,
    })
  ),
};

Navbar.defaultProps = {
  permissions: [],
};

export default Navbar;
