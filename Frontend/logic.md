🔁 1. Function Triggered on Form Submit
js
Copy
Edit
const handleSubmit = async (e) => {
This function runs when the form is submitted (e.g., user clicks "Login").

The async keyword allows use of await inside for handling asynchronous operations like API calls.

js
Copy
Edit
  e.preventDefault();
Stops the default browser behavior of reloading the page after form submit.

⚠️ 2. Initial Validation and Cleanup
js
Copy
Edit
  setError("");
Clears any previous error message before starting new login attempt.

js
Copy
Edit
  if (!email || !password) {
    setError("Email and password are required");
    return;
  }
Basic form validation. If email or password is missing, show error and stop further execution.

🔁 3. Backend API Call
js
Copy
Edit
  const res = await axios.post("http://localhost:1000/api/login", {
    email,
    password,
  });
✅ What happens here:

Sends a POST request to your Node.js backend at /api/login.

Sends the email and password as a JSON object in the request body.

The backend checks if the credentials are valid and returns a response like:

json
Copy
Edit
{
  "token": "JWT123abc...",
  "user": {
    "_id": "user123",
    "name": "John",
    "role": "admin",
    "email": "john@example.com"
  }
}
📥 4. View Response in Console
js
Copy
Edit
  console.log(res.data.token);
Logs the token returned from backend (this proves login is successful).

Use console.log(res.data) if you want to see the full response.

💾 5. Store User Info in Browser (localStorage)
js
Copy
Edit
  if (res.data.token) {
Checks if login was successful (i.e., token received).

js
Copy
Edit
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    localStorage.setItem("userId", res.data.user._id);
✅ What this does:

Saves the JWT token to localStorage for future use (e.g., to authenticate protected pages).

Stores the full user object as a string (must use JSON.stringify()).

Stores user _id separately for easy reference.

👮 6. Role-Based Redirection
js
Copy
Edit
    const role = res.data.user.role;
Extracts the user role from response to decide where to navigate.

✅ Admin Login Flow
js
Copy
Edit
    if (role === "admin") {
      alert("✅ Admin logged in");
      navigate("/superadmin");
    }
Redirects admin users to /superadmin.

✅ HR Login Flow
js
Copy
Edit
    else if (role === "hr") {
      const empRes = await axios.get(
        `http://localhost:1000/employees?name=${encodeURIComponent(res.data.user.name)}`
      );
Makes another API call to get HR employee _id using the user's name.

Useful when the login response has user info but not the associated HR/Employee _id.

js
Copy
Edit
      if (empRes.data && empRes.data._id) {
        localStorage.setItem("employeeId", empRes.data._id);
        navigate("/home");
      }
✅ Employee Login Flow
js
Copy
Edit
    else if (role === "employee") {
      const empRes = await axios.get(
        `http://localhost:1000/employees?name=${encodeURIComponent(res.data.user.name)}`
      );
Same as HR, fetches employee record by name to get _id.

js
Copy
Edit
      if (empRes.data && empRes.data._id) {
        localStorage.setItem("employeeId", empRes.data._id);
        navigate(`/emp_page/${empRes.data._id}`);
      }
✅ Fallback Role Flow
js
Copy
Edit
    else {
      alert("✅ Logged in");
      navigate("/");
    }
For any other roles not covered, navigate to home.

❌ If Login Fails
js
Copy
Edit
  } else {
    setError("Invalid credentials");
  }
🔥 If API Throws Error (like server down or 401)
js
Copy
Edit
} catch (e) {
  setError(e.response?.data?.error || "Server error");
}
Catches and displays backend error messages like "User not found" or "Invalid password".

If there's no specific error, fallback is "Server error".

✅ How Data Flows
plaintext
Copy
Edit
1. React Form Input:     email & password
2. POST /api/login       --> Backend verifies and returns token + user object
3. Stores in localStorage:
     - token
     - user (name, role, etc.)
     - userId
4. Makes another GET call to /employees (for HR/employee role) using user name
5. Stores employeeId in localStorage and redirects based on role
✅ To Print Everything from Backend
To log the complete response from backend:

js
Copy
Edit
console.log("Backend Response:", res.data);