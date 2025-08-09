import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {  toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Master = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(
        "http://localhost:1000/api/login",
        {
          email: email.trim(),
          password: password.trim(),
        },
        { withCredentials: true }
      );

      const { token, user } = res.data;
      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("userId", user._id);

        if (user.role === "admin") {
          toast.success(" Admin logged in");
          navigate("/superadmin");
        } else if (user.role === "hr" || user.role === "employee") {
          try {
            const empRes = await axios.get(
              `http://localhost:1000/employees?name=${encodeURIComponent(
                user.name
              )}`
            );

            if (empRes.data && empRes.data._id) {
              localStorage.setItem("employeeId", empRes.data._id);
              toast.success(` ${user.role.toUpperCase()} logged in`);
              navigate("/dash");
            } else {
              setError(`${user.role} record not found`);
              toast.error(`${user.role} record not found`);
            }
          } catch (err) {
            toast.error("Failed to fetch employee data",err);
          }
        } else {
          navigate("/");
        }
      } else {
        setError("Invalid credentials");
        toast.error("Invalid credentials");
      }
    } catch (e) {
      setError(e.response?.data?.error || "Server error");
      toast.error(e.response?.data?.error || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div
        className="card shadow-lg p-4 rounded-4"
        style={{ width: "100%", maxWidth: "400px" }}
      >
        <div className="text-center mb-4">
          <i className="bi bi-shield-lock-fill fs-1 text-primary"></i>
          <h3 className="mt-2 fw-bold">Sign In</h3>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="mb-3">
            <label htmlFor="loginEmail" className="form-label fw-semibold">
              Email address
            </label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-envelope-fill"></i>
              </span>
              <input
                type="email"
                id="loginEmail"
                className="form-control"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="mb-3">
            <label htmlFor="loginPassword" className="form-label fw-semibold">
              Password
            </label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-lock-fill"></i>
              </span>
              <input
                type="password"
                id="loginPassword"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Extra Options */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="rememberMe"
              />
              <label className="form-check-label" htmlFor="rememberMe">
                Remember me
              </label>
            </div>
            <Link
              to="/forget"
              className="text-decoration-none small text-primary"
            >
              Forgot password?
            </Link>
          </div>

          {/* Error Display */}
          {error && <div className="alert alert-danger py-2">{error}</div>}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary w-100 fw-semibold"
            disabled={loading}
          >
            {loading ? (
              "Signing in..."
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right me-2"></i> Sign In
              </>
            )}
          </button>
        </form>
      </div>

    
    </div>
  );
};

export default Master;
