
// express is downloaded in the folder terminal and is used to define HTTP routes
const express = require("express");
//Creates a connection to the website database for continous running
const { Pool } = require("pg");
// bcrypt is used to hash passwords so that they can be stored safely
const bcrypt = require("bcrypt");

const application = express();
application.use(express.json());
// var application is assigned to express() to create the server application
// application.use(express.json()) enables middleware that allows parsing JSON requests 
//hence making them available later on with req. Without this the website could not take in requests

// This piece of code allows a public path for users/new users to traverse the system
const path = require("path");
application.use(express.static(path.join(__dirname, "public")));

// Uses Render provided port to connect to website 
const PORT = process.env.PORT || 3000;

// This piece of code is used to connect the database to a webserver
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
});


// Create user (updated: degree_type, year_of_study_currunt)
//works by reading the input fields in req.body
//performs validation check for each input from user
//hashes the password
// inserts a new row into the digigtal data base
// returns the created user without the password hash
application.post("/users", async (req, res) => {
  try {
    const first_name = String(req.body.first_name || "").trim();
    const last_name = String(req.body.last_name || "").trim();
    const age = Number(req.body.age);
    const subject = String(req.body.subject || "").trim();
    const degree_type = String(req.body.degree_type || "").trim();
    const year_of_study_currunt = Number(req.body.year_of_study_currunt);
    const email = String(req.body.email || "").trim().toLowerCase();
    const description = String(req.body.description || "").trim();
    const password = String(req.body.password || "");

    if (!first_name || !last_name || !subject || !degree_type || !email || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!Number.isInteger(age) || age < 0) {
      return res.status(400).json({ error: "Invalid age" });
    }
    if (!Number.isInteger(year_of_study_currunt) || year_of_study_currunt < 1) {
      return res.status(400).json({ error: "Invalid year_of_study_currunt" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    if (description.length > 1000) {
      return res.status(400).json({ error: "Description too long" });
    }

    const password_hash = await bcrypt.hash(password, 12);

    //query uses placeholders to prevent SQL injection 
    // returned statement has no hash

    const result = await pool.query(
      `INSERT INTO users
        (first_name, last_name, age, subject, degree_type, year_of_study_currunt, email, description, password_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, first_name, last_name, age, subject, degree_type, year_of_study_currunt, email, description;`,
      [
        first_name,
        last_name,
        age,
        subject,
        degree_type,
        year_of_study_currunt,
        email,
        description,
        password_hash,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    // err.code = "23505" is used to catch duplicate emails to prevent malicous users from creating duplicate accounts breaking the system
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// List users (never return password_hash) updated columns
application.get("/users", async (req, res) => {
  const result = await pool.query(
    `SELECT id, first_name, last_name, age, subject, degree_type, year_of_study_currunt, email, description
     FROM users
     ORDER BY id ASC;`
  );
  res.json(result.rows);
});
// Fetches all users by ID returns a JSON array as created within the folder

application.listen(PORT, () => console.log("Running on", PORT));
// This piece of code starts the server by telling it to start accepting HTML requests on the Render port used for this project