import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { MdAddIcCall, MdAttachEmail } from "react-icons/md";
import { CiCalendarDate } from "react-icons/ci";
import { TiStarFullOutline } from "react-icons/ti";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Cell,
} from "recharts";
import { format } from "date-fns";

// InfoCard Component
const InfoCard = ({ icon, label, value, color }) => (
  <div
    className={`flex flex-row items-center bg-white rounded-xl px-4 py-3 gap-3 border ${color} shadow-sm min-w-0`}
    style={{ minHeight: 0 }}
  >
    <div
      className={`flex items-center justify-center rounded-lg ${
        color.includes("blue")
          ? "bg-blue-100 text-blue-600"
          : color.includes("yellow")
          ? "bg-yellow-100 text-yellow-600"
          : color.includes("green")
          ? "bg-green-100 text-green-600"
          : color.includes("purple")
          ? "bg-purple-100 text-purple-600"
          : "bg-gray-100 text-gray-700"
      }`}
      style={{ fontSize: 22, width: 38, height: 38 }}
    >
      {icon}
    </div>
    <div className="flex flex-col justify-center min-w-0">
      <span
        className="text-xs text-gray-500 font-medium leading-tight truncate"
        title={label}
      >
        {label}
      </span>
      <span
        className="text-base font-bold text-gray-800 truncate leading-tight"
        title={value}
      >
        {value}
      </span>
    </div>
  </div>
);

InfoCard.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string.isRequired,
};

// CustomTooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const ratingData = payload.find((p) => p.dataKey === "rating");
    const targetData = payload.find((p) => p.dataKey === "target");
    return (
      <div className="bg-white text-gray-900 p-3 rounded-lg shadow-xl text-sm border border-blue-200 min-w-[120px]">
        <p className="font-bold text-blue-700 mb-1">{label}</p>
        {ratingData && (
          <p className="text-base font-semibold">
            Your Rating:{" "}
            <span className="text-blue-600 font-bold">
              {typeof ratingData.value === "number"
                ? Number(ratingData.value).toFixed(1)
                : ratingData.value}
            </span>
          </p>
        )}
        {targetData && (
          <p className="text-base font-semibold">
            Target Rating:{" "}
            <span className="text-yellow-600 font-bold">
              {typeof targetData.value === "number"
                ? Number(targetData.value).toFixed(1)
                : targetData.value}
            </span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string,
};

// Main Employee Dashboard Component
const EmpDash = () => {
  const [employee, setEmployee] = useState({});
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const targetRating = 5.0;

  useEffect(() => {
    const empId = localStorage.getItem("employeeId");
    if (!empId) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const empRes = await axios.get(
          `http://localhost:1000/employees/${empId}`
        );
        if (empRes.data) {
          setEmployee(empRes.data);
          const [weeklyRes, monthlyRes] = await Promise.all([
            axios.get(
              `http://localhost:1000/task/ratings/weekly/${empRes.data.name}`
            ),
            axios.get(
              `http://localhost:1000/task/ratings/monthly/${empRes.data.name}`
            ),
          ]);
          setWeeklyStats(weeklyRes.data);
          setMonthlyStats(monthlyRes.data);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Chart data prep functions
  const prepareWeeklyChartData = () => {
    if (!weeklyStats) return [];
    const dayMap = {};
    weeklyStats.tasks?.forEach((task) => {
      const date = task.startedAt || task.createdAt;
      const day = date ? format(new Date(date), "EEE") : null;
      if (day) {
        if (!dayMap[day]) dayMap[day] = [];
        dayMap[day].push(task.rating);
      }
    });
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return weekDays.map((day) => ({
      name: day,
      rating: dayMap[day]?.length
        ? (dayMap[day].reduce((a, b) => a + b, 0) / dayMap[day].length).toFixed(
            2
          )
        : 0,
      target: targetRating,
    }));
  };

  const prepareMonthlyChartData = () => {
    if (!monthlyStats) return [];
    const monthMap = {};
    monthlyStats.tasks?.forEach((task) => {
      const date = task.startedAt || task.createdAt;
      const month = date ? format(new Date(date), "MMM") : null;
      if (month) {
        if (!monthMap[month]) monthMap[month] = [];
        monthMap[month].push(task.rating);
      }
    });
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return months.map((month) => ({
      name: month,
      rating: monthMap[month]?.length
        ? (
            monthMap[month].reduce((a, b) => a + b, 0) / monthMap[month].length
          ).toFixed(2)
        : 0,
      target: targetRating,
    }));
  };

  const calculateOverallAverage = () => {
    if (!weeklyStats || !monthlyStats) return "N/A";
    const weeklyRatings = weeklyStats.tasks?.map((t) => t.rating) || [];
    const monthlyRatings = monthlyStats.tasks?.map((t) => t.rating) || [];
    const allRatings = [...weeklyRatings, ...monthlyRatings];
    if (allRatings.length === 0) return "N/A";
    return (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(
      1
    );
  };
  const averageRating = calculateOverallAverage();

  // Bar color logic
  const getBarColor = (rating, target) => {
    if (rating >= target) return "#22c55e"; // Green
    if (rating > 0) return "#f97316"; // Orange
    return "#a1a1aa"; // Gray
  };

  const bestWeekly = Math.max(
    ...prepareWeeklyChartData().map((d) => Number(d.rating) || 0)
  );
  const bestMonthly = Math.max(
    ...prepareMonthlyChartData().map((d) => Number(d.rating) || 0)
  );

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-6 px-6 bg-gradient-to-b from-blue-100 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">
            Loading your performance data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-10 pb-6 px-2 sm:px-4 bg-gradient-to-b from-blue-100 to-purple-100 font-sans antialiased flex flex-col items-center justify-center">
      <div className="w-full max-w-7xl mx-auto bg-white/90 rounded-2xl shadow-lg border border-gray-100 px-4 sm:px-8 py-6 flex flex-col gap-6">
        {/* Welcome */}
        <div className="flex flex-col items-center justify-center mb-2">
          <p className="text-lg sm:text-2xl font-semibold opacity-90 text-gray-800 text-center">
            <h4
              className="ml-2 font-extrabold animate-pulse bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-md"
              style={{
                animation: "colorBlink 2.5s linear infinite",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "gray",
              }}
            >
              Welcome {employee.name || "Employee"}!
            </h4>
            Here are your key metrics and progress insights.
          </p>
          <style>{`
            @keyframes colorBlink {
              0% { filter: brightness(1.2) saturate(1.2); }
              50% { filter: brightness(2) saturate(2); }
              100% { filter: brightness(1.2) saturate(1.2); }
            }
          `}</style>
        </div>

        {/* Info Cards */}
        <div className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 w-full">
            <InfoCard
              icon={<MdAttachEmail size={20} />}
              label="Email"
              value={employee.email || "-"}
              color="border-blue-200"
            />
            <InfoCard
              icon={<MdAddIcCall size={20} />}
              label="Phone"
              value={employee.phone || "-"}
              color="border-green-200"
            />
            <InfoCard
              icon={<CiCalendarDate size={20} />}
              label="Date of Joining"
              value={
                employee.date_of_joining
                  ? format(new Date(employee.date_of_joining), "MMM d, yyyy")
                  : "-"
              }
              color="border-purple-200"
            />
            <InfoCard
              icon={<TiStarFullOutline size={18} color="#fbbf24" />}
              label="Overall Avg. Rating"
              value={`${averageRating} / 5.0`}
              color="border-yellow-200"
            />
          </div>
        </div>

        {/* Main Analytics Section */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 drop-shadow-lg flex items-center gap-3">
              <span className="text-3xl md:text-4xl">📊</span> Rating{" "}
              <span className="text-blue-600">Analytics</span>
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-4 py-2 rounded-full text-base font-bold shadow-md border-2 border-yellow-300">
                Target:{" "}
                <span className="text-blue-700 font-extrabold">
                  {targetRating.toFixed(1)}
                </span>
              </span>
              <span className="bg-gradient-to-r from-green-400 to-green-600 text-white px-4 py-2 rounded-full text-base font-bold shadow-md border-2 border-green-300">
                Best Weekly:{" "}
                <span className="text-yellow-200 font-extrabold">
                  {bestWeekly.toFixed(1)}
                </span>
              </span>
              <span className="bg-gradient-to-r from-pink-400 to-yellow-400 text-white px-4 py-2 rounded-full text-base font-bold shadow-md border-2 border-pink-300">
                Best Monthly:{" "}
                <span className="text-yellow-200 font-extrabold">
                  {bestMonthly.toFixed(1)}
                </span>
              </span>
            </div>
          </div>

          {/* Dual Bar Chart Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Weekly Bar Chart Card */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-blue-200 flex flex-col">
              <h3 className="text-lg font-bold text-blue-700 mb-2 flex items-center gap-2">
                📅 Weekly Analysis
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={prepareWeeklyChartData()}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  barCategoryGap="15%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={{ stroke: "#9ca3af" }}
                    tick={{ fill: "#4b5563", fontSize: 12 }}
                  />
                  <YAxis
                    domain={[0, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    axisLine={{ stroke: "#9ca3af" }}
                    tick={{ fill: "#4b5563", fontSize: 12 }}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "#f3f4f6", opacity: 0.5 }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: 10 }}
                  />

                  {/* TARGET RATING (Base Layer) */}
                  <Bar
                    dataKey="target"
                    name="Target Rating"
                    fill="#facc15"
                    radius={[10, 10, 0, 0]}
                    opacity={0.35}
                    animationBegin={0}
                    animationDuration={1500}
                  />

                  {/* YOUR ACTUAL RATING (Overlay) */}
                  <Bar
                    dataKey="rating"
                    name="Your Rating"
                    radius={[10, 10, 0, 0]}
                    animationBegin={500}
                    animationDuration={1000}
                  >
                    {prepareWeeklyChartData().map((entry, idx) => (
                      <Cell
                        key={`weekly-cell-${idx}`}
                        fill={getBarColor(entry.rating, targetRating)}
                        stroke={getBarColor(entry.rating, targetRating)}
                        strokeWidth={entry.rating >= targetRating ? 2 : 0}
                      />
                    ))}
                  </Bar>

                  <ReferenceLine
                    y={targetRating}
                    stroke="#dc2626"
                    strokeDasharray="5 5"
                    strokeWidth={1.5}
                    label={{
                      position: "insideTopRight",
                      value: `Target: ${targetRating}`,
                      fill: "#dc2626",
                      fontSize: 12,
                      fontWeight: "bold",
                      offset: 5,
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-2 text-sm text-gray-600">
                <strong>Avg:</strong>{" "}
                {weeklyStats?.averageRating
                  ? parseFloat(weeklyStats.averageRating).toFixed(1)
                  : "N/A"}{" "}
                / 5.0
                {" · "}
                <strong>Tasks:</strong> {weeklyStats?.totalTasks || 0}
              </div>
            </div>

            {/* Monthly Bar Chart Card */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-yellow-200 flex flex-col">
              <h3 className="text-lg font-bold text-yellow-700 mb-2 flex items-center gap-2">
                📈 Monthly Analysis
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={prepareMonthlyChartData()}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  barCategoryGap="15%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={{ stroke: "#9ca3af" }}
                    tick={{ fill: "#4b5563", fontSize: 12 }}
                  />
                  <YAxis
                    domain={[0, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    axisLine={{ stroke: "#9ca3af" }}
                    tick={{ fill: "#4b5563", fontSize: 12 }}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "#f3f4f6", opacity: 0.5 }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: 10 }}
                  />

                  {/* TARGET RATING (Base Layer) */}
                  <Bar
                    dataKey="target"
                    name="Target Rating"
                    fill="#facc15"
                    radius={[10, 10, 0, 0]}
                    opacity={0.35}
                    animationBegin={0}
                    animationDuration={1500}
                  />

                  {/* YOUR ACTUAL RATING (Overlay) */}
                  <Bar
                    dataKey="rating"
                    name="Your Rating"
                    radius={[10, 10, 0, 0]}
                    animationBegin={500}
                    animationDuration={1000}
                  >
                    {prepareMonthlyChartData().map((entry, idx) => (
                      <Cell
                        key={`monthly-cell-${idx}`}
                        fill={getBarColor(entry.rating, targetRating)}
                        stroke={getBarColor(entry.rating, targetRating)}
                        strokeWidth={entry.rating >= targetRating ? 2 : 0}
                      />
                    ))}
                  </Bar>

                  <ReferenceLine
                    y={targetRating}
                    stroke="#dc2626"
                    strokeDasharray="5 5"
                    strokeWidth={1.5}
                    label={{
                      position: "insideTopRight",
                      value: `Target: ${targetRating}`,
                      fill: "#dc2626",
                      fontSize: 12,
                      fontWeight: "bold",
                      offset: 5,
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-2 text-sm text-gray-600">
                <strong>Avg:</strong>{" "}
                {monthlyStats?.averageRating
                  ? parseFloat(monthlyStats.averageRating).toFixed(1)
                  : "N/A"}{" "}
                / 5.0
                {" · "}
                <strong>Tasks:</strong> {monthlyStats?.totalTasks || 0}
              </div>
            </div>
          </div>

          {/* Performance Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-md">
              <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center gap-2">
                📅 Weekly Performance Highlights
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  <span className="font-medium">Total Tasks This Week: </span>
                  <span className="ml-auto font-bold">
                    {weeklyStats?.totalTasks || 0}
                  </span>
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <span className="font-medium">
                    Average Rating This Week:{" "}
                  </span>
                  <span className="ml-auto font-bold">
                    {weeklyStats?.averageRating
                      ? parseFloat(weeklyStats.averageRating).toFixed(1)
                      : "N/A"}{" "}
                    / 5.0
                  </span>
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  <span className="font-medium">Highest Rating Day: </span>
                  <span className="ml-auto font-bold">
                    {
                      weeklyStats?.dailyRatings?.reduce(
                        (maxDay, day) =>
                          parseFloat(day.average) > parseFloat(maxDay.average)
                            ? day
                            : maxDay,
                        { average: 0, day: "N/A" }
                      ).day
                    }
                  </span>
                </li>
              </ul>
            </div>
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 shadow-md">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                📈 Monthly Performance Insights
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-600 rounded-full mr-2"></span>
                  <span className="font-medium">Total Tasks This Month: </span>
                  <span className="ml-auto font-bold">
                    {monthlyStats?.totalTasks || 0}
                  </span>
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                  <span className="font-medium">
                    Average Rating This Month:{" "}
                  </span>
                  <span className="ml-auto font-bold">
                    {monthlyStats?.averageRating
                      ? parseFloat(monthlyStats.averageRating).toFixed(1)
                      : "N/A"}{" "}
                    / 5.0
                  </span>
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  <span className="font-medium">Highest Rating Month: </span>
                  <span className="ml-auto font-bold">
                    {
                      monthlyStats?.monthlyRatings?.reduce(
                        (maxMonth, month) =>
                          parseFloat(month.averageRating) >
                          parseFloat(maxMonth.averageRating)
                            ? month
                            : maxMonth,
                        { averageRating: 0, month: "N/A" }
                      ).month
                    }
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmpDash;
