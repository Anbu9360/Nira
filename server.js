const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, "public")));

// Homepage Route
app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

// Login Page
app.get("/login", (req, res) => {

    res.sendFile(
        path.join(__dirname, "public", "login.html")
    );
});

// Dashboard Page
app.get("/dashboard", (req, res) => {

    res.sendFile(
        path.join(__dirname, "public", "dashboard.html")
    );
});

// Job Page
app.get("/job/:id", (req, res) => {

    res.sendFile(
        path.join(__dirname, "public", "job.html")
    );
});

// Start Server
app.listen(PORT, () => {

    console.log(
        `🚀 Nira running on port ${PORT}`
    );
});