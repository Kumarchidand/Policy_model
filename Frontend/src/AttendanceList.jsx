import React, { useEffect, useState } from "react";
import axios from "axios";

const AttendanceList = () => {
  const [attendanceData, setAttendanceData] = useState([]);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await axios.get("http://localhost:1000/api/attendance");
      setAttendanceData(res.data);
    } catch (error) {
      console.error("Failed to fetch attendance", error);
    }
  };

  return (
    <div className="container mt-4">
      <h3>Employee Attendance</h3>
      <table className="table table-bordered table-striped">
        <thead>
          <tr>
            <th>Employee Name</th>
            <th>Date</th>
            <th>Check In</th>
            <th>Check Out</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {attendanceData.map((entry) => (
            <tr key={entry._id}>
              <td>{entry.emp_name}</td>
              <td>{new Date(entry.date).toLocaleDateString()}</td>
              <td>{entry.check_in}</td>
              <td>{entry.check_out}</td>
              <td>
                {entry.is_active ? (
                  <span className="badge bg-success">Present</span>
                ) : (
                  <span className="badge bg-danger">Absent</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceList;
