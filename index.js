import express from "express";
import cookieparser from "cookie-parser";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

app.use(cookieparser());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
  user: "postgres",
  password: "VINAY1236",
  host: "localhost",
  database: "user-details",
  port: 5432,
});

db.connect()
  .then(() => console.log("connected to the database."))
  .catch((err) => console.log("connection error: ", err.stack));

app.get("/", (req, res) => {
  res.render("index.ejs", {
    title: "Please Sign Up",
  });
});

app.get("/register", (req, res) => {
  res.render("register.ejs", {
    title: "Please Register Yourself.",
  });
});

app.post("/register", async (req, res) => {
  try {
    let email = req.body.email;
    let password = req.body.password;
    let rememberMe = req.body.rememberMe;

    if (!email || !password) {
      return res.render("register.ejs", {
        title: "Email and Password are required.",
      });
    }

    console.log(email);
    console.log(password);

    try {
      await db.query(
        "insert into userdetail(useremail, userpassword) values($1, $2)",
        [email, password]
      );
      return res.redirect("/");
    } catch (err) {
      console.log(err.stack);
      return res.render("index.ejs", {
        title: "Already Registered. Try to Sign in.",
      });
    }
  } catch (error) {
    console.error("Error during registration:", error);
    return res.status(500).send("Internal Server Error");
  }
});

app.post("/signin", async (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  console.log("Email:", email);
  console.log("Password:", password);

  try {
    const result = await db.query(
      "select * from userdetail where useremail = $1 and userpassword = $2",
      [email, password]
    );

    if (result.rows.length > 0) {
      console.log("Signed in Successfully.");
      let rememberMe = req.body.rememberMe;
      if (rememberMe) {
        res.cookie("rememberMe", email, { maxAge: 900000, httpOnly: true });
      } else {
        res.cookie("rememberMe", email);
      }

      return res.render("home.ejs");
    } else {
      return res.render("index.ejs", {
        title: "Invalid Email or Password",
      });
    }
  } catch (err) {
    console.log(err);
    return res.send("An error occurred during sign-in! Try again");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
