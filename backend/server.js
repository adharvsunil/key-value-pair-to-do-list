const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const AWS = require("aws-sdk");
const bcrypt = require("bcrypt");
require('dotenv').config();

const app = express();

// ------------------- CORS -------------------
const corsOptions = {
  origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// ------------------- Body Parsing -------------------
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ------------------- AWS DynamoDB -------------------
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const docClient = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = "Users";
const TASKS_TABLE = "Tasks";

// ------------------- Routes -------------------

// Register user
app.post("/register", async (req, res) => {
  try {
    if (!req.body) return res.status(400).json({ error: "Request body missing" });

    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const params = {
      TableName: USERS_TABLE,
      Item: { username, password: hashedPassword },
      ConditionExpression: "attribute_not_exists(username)",
    };

    await docClient.put(params).promise();
    console.log(`User '${username}' registered successfully`);
    res.json({ success: true, message: "User registered" });

  } catch (err) {
    console.error("Register error:", err);
    if (err.code === "ConditionalCheckFailedException") {
      res.status(400).json({ error: "Username already exists" });
    } else if (err.code === "AccessDeniedException") {
      res.status(403).json({ error: "Access denied to DynamoDB. Check IAM policy." });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// Login user
app.post("/login", async (req, res) => {
  try {
    if (!req.body) return res.status(400).json({ error: "Request body missing" });

    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });

    const params = { TableName: USERS_TABLE, Key: { username } };
    const data = await docClient.get(params).promise();

    if (!data.Item) return res.status(400).json({ error: "User not found" });

    const validPassword = await bcrypt.compare(password, data.Item.password);
    if (!validPassword) return res.status(401).json({ error: "Invalid password" });

    res.json({ success: true, message: "Login successful" });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get tasks for a user
app.get("/tasks/:username", async (req, res) => {
  try {
    const username = req.params.username;
    const params = {
      TableName: TASKS_TABLE,
      KeyConditionExpression: "username = :u",
      ExpressionAttributeValues: { ":u": username },
    };

    const data = await docClient.query(params).promise();
    res.json(data.Items);

  } catch (err) {
    console.error("Tasks fetch error:", err);
    res.status(500).json({ error: "Could not fetch tasks" });
  }
});

// Add task
app.post("/tasks", async (req, res) => {
  try {
    if (!req.body) return res.status(400).json({ error: "Request body missing" });

    const { username, taskId, task } = req.body;
    if (!username || !taskId || !task) return res.status(400).json({ error: "username, taskId, and task required" });

    const params = {
      TableName: TASKS_TABLE,
      Item: { username, taskId, task },
    };

    await docClient.put(params).promise();
    res.json({ success: true, message: "Task added" });

  } catch (err) {
    console.error("Add task error:", err);
    res.status(500).json({ error: "Could not add task" });
  }
});

// Delete task
app.delete("/tasks/:username/:taskId", async (req, res) => {
  try {
    let { username, taskId } = req.params;
    username = decodeURIComponent(username);
    taskId = decodeURIComponent(taskId);

    if (!username || !taskId) return res.status(400).json({ error: "Username and taskId required" });

    const params = {
      TableName: TASKS_TABLE,
      Key: { username, taskId },
    };

    await docClient.delete(params).promise();
    res.json({ success: true, message: "Task deleted" });

  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ error: "Could not delete task" });
  }
});

// ------------------- Start server -------------------
const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
