import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useEffect, useState } from "react";
import axios from "axios";

// Spinner ki CSS. Isay ya to yahin rakh sakte hain, ya kisi CSS file me paste kar dein.
const spinnerStyle = `
.spinner {
  border: 6px solid #e5e7eb;
  border-top: 6px solid #4f46e5;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg);}
  100% { transform: rotate(360deg);}
}
`;

const AvgRatingChart = () => {
  const [weeklyData, setWeeklyData] = useState({
    weeklyData: [],
    employees: [],
  });
  const [monthlyData, setMonthlyData] = useState({
    monthlyData: [],
    employees: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const colors = [
    "#4f46e5",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#f97316",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Weekly ratings
        const weeklyRes = await axios.get(
          "http://localhost:1000/task/ratings/weekly"
        );
        setWeeklyData({
          weeklyData: weeklyRes.data.weeklyData,
          employees: weeklyRes.data.employees,
        });
        // Monthly ratings
        const monthlyRes = await axios.get(
          "http://localhost:1000/task/ratings/monthly"
        );
        setMonthlyData({
          monthlyData: monthlyRes.data.monthlyData,
          employees: monthlyRes.data.employees,
        });
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  if (loading) {
    return (
      <>
        {/* Spinner CSS */}
        <style>{spinnerStyle}</style>
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "300px",
          }}
        >
          <div>
            <div className="spinner"></div>
            <p>Loading employee ratings...</p>
          </div>
        </div>
      </>
    );
  }
  if (error) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "red",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "300px",
        }}
      >
        {error}
      </div>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "2rem",
        padding: "2rem",
        maxWidth: "1400px",
        margin: "0 auto",
      }}
    >
      {/* Spinner CSS - Chart render hone pe bhi show ho taki direct paste pe bhi spinner mile */}
      <style>{spinnerStyle}</style>
      {/* Weekly Ratings */}
      <div
        style={{
          flex: "1 1 100%",
          minWidth: "300px",
          backgroundColor: "#fff",
          borderRadius: "8px",
          padding: "1.5rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <h3
          style={{
            marginBottom: "1.5rem",
            color: "#4f46e5",
            fontSize: "1.25rem",
            fontWeight: "600",
          }}
        >
          Weekly Employee Ratings by Day
        </h3>
        {weeklyData.weeklyData.length > 0 ? (
          <div>
            <ResponsiveContainer width="100%" height={500}>
              <BarChart
                data={weeklyData.weeklyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                barGap={5}
                barCategoryGap={15}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [`${value}/5.0`, name]}
                  labelFormatter={(day) => `Day: ${day}`}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend
                  wrapperStyle={{
                    paddingBottom: "20px",
                  }}
                />
                {weeklyData.employees.map((employee, index) => (
                  <Bar
                    key={employee}
                    dataKey={employee}
                    name={employee}
                    fill={colors[index % colors.length]}
                    barSize={20}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "#666",
            }}
          >
            No weekly rating data available
          </div>
        )}
      </div>
      {/* Monthly Ratings */}
      <div
        style={{
          flex: "1 1 100%",
          minWidth: "300px",
          backgroundColor: "#fff",
          borderRadius: "8px",
          padding: "1.5rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <h3
          style={{
            marginBottom: "1.5rem",
            color: "#10b981",
            fontSize: "1.25rem",
            fontWeight: "600",
          }}
        >
          Monthly Average Ratings
        </h3>

        {monthlyData.monthlyData.length > 0 ? (
          <div>
            <ResponsiveContainer width="100%" height={500}>
              <BarChart
                data={monthlyData.monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                barGap={5}
                barCategoryGap={15}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [`${value}/5.0`, name]}
                  labelFormatter={(month) => `Month: ${month}`}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend
                  wrapperStyle={{
                    paddingBottom: "20px",
                  }}
                />
                {monthlyData.employees.map((employee, index) => (
                  <Bar
                    key={employee}
                    dataKey={employee}
                    name={employee}
                    fill={colors[index % colors.length]}
                    barSize={20}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "#666",
            }}
          >
            No monthly rating data available
          </div>
        )}
      </div>
    </div>
  );
};

export default AvgRatingChart;
