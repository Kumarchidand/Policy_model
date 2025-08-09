import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import Home from "./Home";
import Add from "./Add";
import HRPolicy from "./HRPolicy";
import Salary from "./Salary";
import TaskDetail from "./Taskdetail";
import Navbar from "./Navbar";
import EmpId from "./EmpId";
import SuperAdmin from "./SuperAdmin";
import Master from "./Master";
// import TaskDashboard from "./TaskDashboard";
import TaskForm from "./TaskForm";
// import Login from "./Login";
import Permission from "./Permission";
import ProtectedRoute from "./ProtectedRoute";
import Forget from "./Forget";
import EmpDash from "./EmpDash";
import AvgRatingChart from "./AvgRatingChart";
import EmployeeLeaveForm from "./EmployeeLeaveForm.jsx";
import HRApprovalPage from "./HRApprovalPage";
import EmployeeLeaveStatus from "./EmployeeLeaveStatus";
import HR1 from "./pages/HR1";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AttendanceList from "./AttendanceList.jsx";
import SalarySlip from "./SalarySlip.jsx";
import SalaryComponentForm from "./pages/SalaryComponentForm.jsx";


import EmployeeAssignedComponentTable from "./EmployeeAssignedComponentTable.jsx";

// AppLayout component accepts props
const AppLayout = ({ permissions }) => {
  const location = useLocation();
  // Only hide navbar on root ("/") or sign-in page
  const isSignInPage =
    location.pathname === "/forget" || location.search === "?admin=true";
  const hideNavbar = location.pathname === "/" || isSignInPage;
  return (
    <div className="d-flex vh-100">
      {!hideNavbar && <Navbar permissions={permissions} />}
      <div className="flex-grow-1 overflow-auto">
        <Routes>
          <Route path="/leave" element={<EmployeeLeaveForm />} />
          <Route path="/approve" element={<HRApprovalPage />} />
          <Route path="/slip" element={<SalarySlip />} />
  
          <Route
            path="/emp_page/:id"
            element={
              <ProtectedRoute allowedRoles={["employee", "Employee"]}>
                <EmpId />
              </ProtectedRoute>
            }
          />
          <Route path="/table" element={<EmployeeAssignedComponentTable />} />
          <Route path="component" element={<SalaryComponentForm />} />
          <Route path="/estatus" element={<EmployeeLeaveStatus />} />
          <Route path="/avg" element={<AvgRatingChart />} />
          <Route path="/dash" element={<EmpDash />} />
          <Route path="/" element={<Master />} />
          <Route path="/policy" element={<HR1 />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home permissions={permissions} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/add"
            element={
              <ProtectedRoute>
                <Add permissions={permissions} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr"
            element={
              <ProtectedRoute>
                <HRPolicy permissions={permissions} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/salary"
            element={
              <ProtectedRoute>
                <Salary permissions={permissions} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/task/:id"
            // element={<TaskModule permissions={permissions} />}
          />
          <Route
            path="/taskdetail"
            element={
              <ProtectedRoute>
                <TaskDetail permissions={permissions} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hrdet"
            element={
              <ProtectedRoute>
                <TaskForm permissions={permissions} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute>
                <SuperAdmin />
              </ProtectedRoute>
            }
          />

          <Route
            path="/per"
            element={
              <ProtectedRoute>
                <Permission />
              </ProtectedRoute>
            }
          />
          <Route path="/forget" element={<Forget />} />
          <Route path="/ad" element={<AttendanceList />} />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={2000}
          style={{ top: "20px", right: "30px" }} // adjust as needed
        />
      </div>
    </div>
  );
};
AppLayout.propTypes = {
  permissions: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      access: PropTypes.bool.isRequired,
    })
  ).isRequired,
};
const App = () => {
  const [permissions, setPermissions] = useState([]);
  useEffect(() => {
    const fetchPermissions = () => {
      const user = JSON.parse(localStorage.getItem("user"));
      //user?._id:>> user && user._id (user && user._id)
      const userId =
        user?._id ||
        localStorage.getItem("employeeId") ||
        localStorage.getItem("userId");
      if (!user) {
        setPermissions([]);
        return;
      }
      if (userId) {
        axios
          .get(`http://localhost:1000/permissions/${userId}`)
          .then((res) => {
            const ops = res.data?.operations || [];
            setPermissions(ops);
          })
          .catch((err) => console.error("Permission fetch error", err));
      }
    };
    fetchPermissions();
    const interval = setInterval(fetchPermissions, 2000); //  every 2 seconds
    return () => clearInterval(interval);
  }, []);
  return (
    <BrowserRouter>
      <AppLayout permissions={permissions} />
    </BrowserRouter>
  );
};

export default App;
