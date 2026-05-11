const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcrypt");
const mysql = require("mysql2");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {

    res.sendFile(__dirname + "/public/index.html");
});
// ---------------- MIDDLEWARE ----------------

app.use(cors());

app.use(bodyParser.json());

app.use(express.static("public"));

app.use(session({
    secret: "nira_secret_key",
    resave: false,
    saveUninitialized: false
}));

// ---------------- DATABASE ----------------

// MySQL temporarily disabled

console.log("Server starting...");
// ---------------- REGISTER ----------------

app.post("/register", async (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "All fields required"
        });
    }

    try {

        const hashedPassword =
            await bcrypt.hash(password, 10);

        db.query(
            "INSERT INTO users (email, password) VALUES (?, ?)",
            [email, hashedPassword],
            (err) => {

                if (err) {

                    return res.status(400).json({
                        message: "User already exists"
                    });
                }

                res.json({
                    message: "Registered successfully"
                });
            }
        );

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

// ---------------- LOGIN ----------------

app.post("/login", (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password required"
        });
    }

    db.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (err, results) => {

            if (err) {

                return res.status(500).json({
                    message: "Server error"
                });
            }

            if (results.length === 0) {

                return res.status(401).json({
                    message: "Invalid credentials"
                });
            }

            const user = results[0];

            const isMatch =
                await bcrypt.compare(
                    password,
                    user.password
                );

            if (!isMatch) {

                return res.status(401).json({
                    message: "Invalid credentials"
                });
            }

            // Save session
            req.session.user = {
                id: user.id,
                email: user.email
            };

            res.json({
                message: "Login successful"
            });
        }
    );
});

// ---------------- LOGOUT ----------------

app.get("/logout", (req, res) => {

    req.session.destroy(() => {

        res.json({
            message: "Logged out"
        });
    });
});

// ---------------- CREATE JOB ----------------

app.post("/create-job", (req, res) => {

    if (!req.session.user) {

        return res.status(401).json({
            message: "Please login first"
        });
    }

    const { title, slots } = req.body;

    if (!title || !slots) {

        return res.status(400).json({
            message: "All fields required"
        });
    }

    db.query(
        "INSERT INTO jobs (title, slots_total, status, created_by) VALUES (?, ?, 'open', ?)",
        [
            title,
            slots,
            req.session.user.id
        ],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    message: "Error creating job"
                });
            }

            res.json({
                message: "Job created",
                link: `http://10.249.66.21:3000/job/${result.insertId}`
            });
        }
    );
});

// ---------------- SERVE JOB PAGE ----------------

app.get("/job/:id", (req, res) => {

    res.sendFile(__dirname + "/public/job.html");
});

// ---------------- FETCH JOB DATA ----------------

app.get("/job-data/:id", (req, res) => {

    const jobId = req.params.id;

    db.query(
        "SELECT * FROM jobs WHERE id = ?",
        [jobId],
        (err, results) => {

            if (err) {

                return res.status(500).json({
                    message: "Server error"
                });
            }

            if (results.length === 0) {

                return res.status(404).json({
                    message: "Job not found"
                });
            }

            const job = results[0];

            res.json({
                id: job.id,
                title: job.title,
                status: job.status,
                slots_total: job.slots_total,
                slots_filled: job.slots_filled,
                slots_remaining:
                    job.slots_total - job.slots_filled
            });
        }
    );
});

// ---------------- APPLY FOR JOB ----------------

app.post("/apply", (req, res) => {

    const { jobId, name, phone } = req.body;

    if (!jobId || !name || !phone) {

        return res.status(400).json({
            message: "All fields required"
        });
    }

    db.beginTransaction((err) => {

        if (err) {

            return res.status(500).json({
                message: "Server error"
            });
        }

        // Lock job row
        db.query(
            "SELECT * FROM jobs WHERE id = ? FOR UPDATE",
            [jobId],
            (err, results) => {

                if (err || results.length === 0) {

                    return db.rollback(() => {

                        res.status(404).json({
                            message: "Job not found"
                        });
                    });
                }

                const job = results[0];

                // Check closed
                if (job.status === "closed") {

                    return db.rollback(() => {

                        res.status(400).json({
                            message: "Job is closed"
                        });
                    });
                }

                // Check full
                if (
                    job.slots_filled >=
                    job.slots_total
                ) {

                    return db.rollback(() => {

                        res.status(400).json({
                            message: "Job is full"
                        });
                    });
                }

                // Duplicate phone check
                db.query(
                    "SELECT * FROM applicants WHERE job_id = ? AND phone = ?",
                    [jobId, phone],
                    (err, dup) => {

                        if (dup.length > 0) {

                            return db.rollback(() => {

                                res.status(400).json({
                                    message: "Already applied"
                                });
                            });
                        }

                        // Insert applicant
                        db.query(
                            "INSERT INTO applicants (job_id, name, phone) VALUES (?, ?, ?)",
                            [jobId, name, phone],
                            (err) => {

                                if (err) {

                                    return db.rollback(() => {

                                        res.status(500).json({
                                            message: "Apply failed"
                                        });
                                    });
                                }

                                // Update slots
                                db.query(
                                    "UPDATE jobs SET slots_filled = slots_filled + 1 WHERE id = ?",
                                    [jobId],
                                    (err) => {

                                        if (err) {

                                            return db.rollback(() => {

                                                res.status(500).json({
                                                    message: "Slot update failed"
                                                });
                                            });
                                        }

                                        db.commit((err) => {

                                            if (err) {

                                                return db.rollback(() => {

                                                    res.status(500).json({
                                                        message: "Commit failed"
                                                    });
                                                });
                                            }

                                            res.json({
                                                message: "Successfully applied!"
                                            });
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    });
});

// ---------------- CLOSE JOB ----------------

app.post("/close-job", (req, res) => {

    if (!req.session.user) {

        return res.status(401).json({
            message: "Please login first"
        });
    }

    const { jobId } = req.body;

    if (!jobId) {

        return res.status(400).json({
            message: "Job ID required"
        });
    }

    db.query(
        "UPDATE jobs SET status = 'closed' WHERE id = ?",
        [jobId],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    message: "Job not found"
                });
            }

            res.json({
                message: "Job closed successfully"
            });
        }
    );
});
app.delete("/delete-job/:id", (req, res) => {

    if (!req.session.user) {

        return res.status(401).json({
            message: "Please login first"
        });
    }

    const jobId = req.params.id;

    // Delete applicants first
    db.query(
        "DELETE FROM applicants WHERE job_id = ?",
        [jobId],
        (err) => {

            if (err) {

                return res.status(500).json({
                    message: "Error deleting applicants"
                });
            }

            // Delete job
            db.query(
                "DELETE FROM jobs WHERE id = ?",
                [jobId],
                (err, result) => {

                    if (err) {

                        return res.status(500).json({
                            message: "Error deleting job"
                        });
                    }

                    if (result.affectedRows === 0) {

                        return res.status(404).json({
                            message: "Job not found"
                        });
                    }

                    res.json({
                        message: "Job deleted successfully"
                    });
                }
            );
        }
    );
});

// ---------------- MY JOBS DASHBOARD ----------------

app.get("/my-jobs", (req, res) => {

    if (!req.session.user) {

        return res.status(401).json({
            message: "Not logged in"
        });
    }

    const userId = req.session.user.id;

    // Only jobs created by logged-in user
    db.query(
        "SELECT * FROM jobs WHERE created_by = ?",
        [userId],
        (err, jobs) => {

            if (err) {

                return res.status(500).json({
                    message: "Error fetching jobs"
                });
            }

            if (jobs.length === 0) {

                return res.json([]);
            }

            const jobIds =
                jobs.map(job => job.id);

            db.query(
                "SELECT * FROM applicants WHERE job_id IN (?)",
                [jobIds],
                (err, applicants) => {

                    if (err) {

                        return res.status(500).json({
                            message: "Error fetching applicants"
                        });
                    }

                    const result =
                        jobs.map(job => ({
                            ...job,
                            applicants:
                                applicants.filter(
                                    applicant =>
                                        applicant.job_id === job.id
                                )
                        }));

                    res.json(result);
                }
            );
        }
    );
});

// ---------------- PAGES ----------------

app.get("/login", (req, res) => {

    res.sendFile(__dirname + "/public/login.html");
});

app.get("/dashboard", (req, res) => {

    res.sendFile(__dirname + "/public/dashboard.html");
});

// ---------------- SERVER ----------------
app.get("/", (req, res) => {

    res.sendFile(__dirname + "/public/index.html");
});
app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `🚀 Nira running on http://localhost:${PORT}`
    );
});