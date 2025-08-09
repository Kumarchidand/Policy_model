import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Forget = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!password || !confirmPassword) {
      setError("Please fill both password fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await axios.post("http://localhost:1000/forget", { email, password });
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setSuccess("Password updated successfully!");
      setTimeout(() => navigate("/"), 2000); // Auto-redirect
    } catch (err) {
      console.error("Error updating password:", err);
      setError("Failed to update password!");
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card shadow p-4" style={{ width: "100%", maxWidth: 450 }}>
        <h3 className="text-center mb-3">🔐 Reset Password</h3>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              <i className="bi bi-envelope-at-fill me-2"></i>Email
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* New Password */}
          <div className="mb-3">
            <label htmlFor="newPassword" className="form-label">
              <i className="bi bi-lock-fill me-2"></i>New Password
            </label>
            <input
              type="password"
              className="form-control"
              id="newPassword"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <label htmlFor="confirmPassword" className="form-label">
              <i className="bi bi-lock-fill me-2"></i>Confirm Password
            </label>
            <input
              type="password"
              className="form-control"
              id="confirmPassword"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* Submit */}
          <button type="submit" className="btn btn-primary w-100 mb-3">
            <i className="bi bi-shield-lock-fill me-2"></i>Update Password
          </button>

          {/* Link to Home */}
          <div className="text-center">
            <Link to="/" className="text-decoration-none">
              <i className="bi bi-arrow-left-circle me-2"></i>Back to Home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Forget;
