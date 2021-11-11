const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const morgan = require("morgan");
const { hashString } = require("./pseudoHash");

app.set("view engine", "ejs");
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan("dev"));

const urlDatabase = {
  "v69tDP": "https://www.lighthouselabs.ca",
  "i4xyhU": "https://www.google.com"
};

const users = {
  "userID1": {
    id: "userID1",
    email: "useremail@email.com",
    password: "userpass",
  }
};

const templateVars = {
  username: null,
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  templateVars.urls = urlDatabase;
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);
  let shortURL = hashString(req.body.longURL); //should we check if longURL is a valid URL? maybe implement this later
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  templateVars.shortURL = req.params.shortURL;
  templateVars.longURL = urlDatabase[req.params.shortURL];
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/edit", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  let shortURLNew = hashString(req.body.update);
  urlDatabase[shortURLNew] = req.body.update;
  res.redirect(`/urls/${shortURLNew}`);
})

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  res.render("login_register", templateVars);
})

app.post("/register", (req, res) => {
  users.newuser = {
    userID: "newuserid",
    email: "useremail@example.com",
    password: "hunter2",
  }
  res.render("login_register", templateVars);
})

app.post("/login", (req, res) => {
  templateVars.username = req.body.username;
  res.cookie("username", req.body.username);
  res.render("urls_index", templateVars);
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  templateVars.username = null;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});