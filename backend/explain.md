# Backend API and Debugging Explanation

This document explains the flow, logic, and debugging approach for each backend route in your `server.js`, with references to the models and how the backend responds to the frontend. It is written for beginners who want to understand how a Node.js/Express/MongoDB backend works in a real project.

---

## 1. Project Structure Overview

- **Express**: Web server framework for Node.js.
- **Mongoose**: ODM (Object Data Modeling) library for MongoDB.
- **Models**: Represent MongoDB collections (tables). Example: `User`, `Employee`, `Task`, `Permission`.
- **Routes**: API endpoints (URLs) that frontend calls to get or update data.
- **Controllers**: (In some projects) Functions that handle the logic for each route.

---

## 2. How Backend Responds to Frontend

- The frontend (React) makes HTTP requests (GET, POST, PUT, DELETE) to the backend API endpoints.
- The backend receives the request, processes it (fetches/updates data in MongoDB), and sends a JSON response.
- The frontend uses this response to update the UI.

---

## 3. Debugging Approach

- **Console Logs**: Use `console.log()` to print variables and flow in the backend.
- **Error Handling**: Use `try/catch` blocks. If an error occurs, send a response with `res.status(500).json({ error: ... })`.
- **Testing**: Use tools like Postman or your frontend to test API endpoints.
- **Check MongoDB**: Use MongoDB Compass or `mongo` shell to see if data is stored as expected.

---

## 4. Route-by-Route Explanation

### /permissions/:userId (POST, GET)

- **Model**: `Permission` (fields: userId, operations)
- **userId**: The MongoDB ObjectId of the user (from `User` collection).
- **operations**: An array or object describing what actions the user can perform (e.g., ['read', 'write']).
- **POST**: Create or update permissions for a user.
  - If a Permission for userId exists, update it. Otherwise, create a new one.
- **GET**: Fetch permissions for a user by userId.
- **How it works**: Used to control what features a user can access in the frontend.

### /employees (GET, POST, DELETE, PUT)

- **Model**: `Employee`
- **GET**: Fetch all employees or a single employee by name or id.
- **POST**: Add a new employee.
- **DELETE**: Remove an employee and all related data (salary increments, tasks).
- **PUT**: Update employee details or role.
- **How it works**: Used for employee management in the HR system.

### /task (GET, POST, DELETE, PUT)

- **Model**: `Task`
- **GET**: Fetch all tasks or tasks for a specific employee.
- **POST**: Add a new task for an employee.
- **PUT**: Update task status (start, pause, complete) and calculate rating.
- **DELETE**: Remove a task.
- **How it works**: Used for task assignment and tracking.

### /task/ratings/weekly/:employeeName

- **Logic**: Fetch all tasks for the employee in the last 7 days. Group by weekday. Calculate average rating and task count for each day.
- **Frontend**: Used to show weekly performance chart.

### /task/ratings/monthly/:employeeName

- **Logic**: Fetch all tasks for the employee in the current year. Group by month. Calculate average rating and task count for each month.
- **Frontend**: Used to show monthly performance chart.

### /task/ratings/weekly and /task/ratings/monthly (no employeeName)

- **Logic**: Fetch all tasks for all employees. Group by day (weekly) or month (monthly). For each employee, calculate average rating for each period.
- **Frontend**: Used for admin/HR dashboards to compare employees.

---

## 5. How to Debug

1. **Check the request in the frontend**: What URL is being called? What data is sent?
2. **Check the backend route**: Is the route implemented? Is it receiving the correct data?
3. **Add console logs**: Print incoming data, query results, and errors.
4. **Check MongoDB**: Is the data being saved/updated as expected?
5. **Check the response**: Is the backend sending the expected JSON?
6. **Check the frontend**: Is it using the response correctly?

---

## 6. Example: Permissions Flow

- When a user logs in, their userId is known.
- The frontend may call `/permissions/:userId` to get what actions the user can do.
- The backend checks the `Permission` model for that userId and returns the allowed operations.
- The frontend uses this to enable/disable features.

---

## 7. Example: Task Completion and Rating

- When a task is completed, the frontend calls `/task/complete/:id` with the time taken.
- The backend calculates the rating based on how fast the task was done (compared to the target duration).
- The task is updated in MongoDB with the new rating.
- The frontend fetches updated ratings for charts.

---

## 8. General Tips for Beginners

- Always check the backend logs for errors.
- Use Postman to test endpoints without the frontend.
- Read the model files to understand what fields are stored.
- Use `console.log()` to trace the flow.
- If something is not updating in the UI, check if the backend is sending the right data.

---

## 9. How to Extend or Change

- To add a new feature, create a new route and update the model if needed.
- To change what data is sent, update the response in the route handler.
- To debug, add logs and check both backend and frontend.

---

This document should help you understand the flow, logic, and debugging process for your backend. As you gain experience, you’ll be able to add more features and debug more complex issues!
