const express = require("express");
const app = express();
const PORT = 8080;
const cookieSession = require('cookie-session');
const morgan = require("morgan");
const { hashString } = require("./pseudoHash");
const bcrypt = require('bcryptjs');

app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2', 'key3'],
  maxAge: 60 * 60 * 1000,
}));

app.use(express.urlencoded({extended: true}));
app.use(morgan("dev"));

const { urlDatabase, users } = require('./server-data/database.js');
const { userURLs, checkCookie, checkUserAndPass, saveToDataBase } = require("./helpers");

app.get("/", (req, res) => {
  if (req.session.userID) {
    return res.redirect("/urls");
  }
  res.redirect("/register");
});

app.get("/urls", (req, res) => {
  let templateVars = checkCookie(req.session.userID);
  templateVars.urls = userURLs(req.session.userID);
  if (!req.session.userID) {
    templateVars.notice = "Please Log in to view your TinyApp URLs.";
    templateVars.page = 'login';
    return res.render("login_register", templateVars);
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = checkCookie(req.session.userID);
  if (!req.session.userID) {
    templateVars.notice = "Please Log in to create a new TinyApp URL.";
    templateVars.page = 'login';
    return res.render("login_register", templateVars);
  }
  return res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = checkCookie(req.session.userID);
  templateVars.urls = userURLs(req.session.userID);
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404);
    return res.send("Error 404: shortURL does not exist.");
  } else if (!req.session.userID) {
    templateVars.notice = "Please Log in to view your TinyApp URLs.";
    templateVars.page = 'login';
    return res.render("login_register", templateVars);
  } else if (urlDatabase[req.params.shortURL].userID !== req.session.userID) {
    templateVars.notice = "URL not available.";
    return res.render("urls_index", templateVars);
  }
  templateVars.shortURL = req.params.shortURL;
  templateVars.longURL = urlDatabase[req.params.shortURL].fullURL;
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404);
    res.send("Error 404: shortURL does not exist.");
  }
  const longURL = urlDatabase[req.params.shortURL].fullURL;
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  let templateVars = checkCookie(req.session.userID);
  if (!req.session.userID) {
    templateVars.notice = "Please log in to begin creating new TinyApp URLs.";
    templateVars.page = 'login';
    return res.render("login_register", templateVars);
  }
  let shortURL = hashString(req.body.longURL); //should we check if longURL is a valid URL? maybe implement this later
  urlDatabase[shortURL] = {
    fullURL: req.body.longURL,
    userID: req.session.userID,
  };
  saveToDataBase();
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/edit", (req, res) => {
  let templateVars = checkCookie(req.session.userID);
  templateVars.urls = userURLs(req.session.userID);
  if (!req.session.userID) {
    templateVars.notice = "Please log in to view and edit your TinyApp URLs.";
    templateVars.page = 'login';
    return res.render("login_register", templateVars);
  }
  if (urlDatabase[req.params.shortURL].userID !== req.session.userID) {
    templateVars.notice = "Error: You can only edit your own TinyApp URLs.";
    return res.render("urls_index", templateVars);
  }
  delete urlDatabase[req.params.shortURL];
  let shortURLNew = hashString(req.body.update);
  urlDatabase[shortURLNew] = {
    fullURL: req.body.update,
    userID: req.session.userID,
  };
  saveToDataBase();
  res.redirect(`/urls/${shortURLNew}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let templateVars = checkCookie(req.session.userID);
  templateVars.urls = userURLs(req.session.userID);
  if (!req.session.userID) {
    templateVars.notice = "Please log in to view and edit your TinyApp URLs.";
    templateVars.page = 'login';
    return res.render("login_register", templateVars);
  }
  if (urlDatabase[req.params.shortURL].userID !== req.session.userID) {
    templateVars.notice = "Error: You can only edit your own TinyApp URLs.";
    return res.render("urls_index", templateVars);
  }
  delete urlDatabase[req.params.shortURL];
  saveToDataBase();
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  let templateVars = checkCookie(req.session.userID);
  if (req.session.userID) {
    return res.redirect("/urls");
  }
  templateVars.page = 'login';
  res.render("login_register", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = checkCookie(req.session.userID);
  if (req.session.userID) {
    return res.redirect("/urls");
  }
  templateVars.page = 'register';
  res.render("login_register", templateVars);
});

app.post("/login", (req, res) => {
  let templateVars = checkCookie(req.session.userID);
  let credentials = checkUserAndPass(req);
  if (credentials.passMatch) {
    req.session.userID = credentials.userID;
    return res.redirect("/urls");
  }
  templateVars.notice = `${req.body.email} is not a registered user.`;
  if (credentials.userExists) {
    templateVars.notice = "Login Failed: Password Incorrect";
  }
  if (req.body.email === "" || req.body.password === "") {
    templateVars.notice = `Email and Password forms cannot be empty.`;
  }
  templateVars.page = 'login';
  return res.render("login_register", templateVars);
});

app.post("/register", (req, res) => {
  let templateVars = checkCookie(req.session.userID);
  let credentials = checkUserAndPass(req);
  if (req.body.email === "" || req.body.password === "") {
    templateVars.notice = `Email and Password forms cannot be empty.`;
    templateVars.page = 'register';
    return res.render("login_register", templateVars);
  }
  if (credentials.userExists) {
    templateVars.notice = `${req.body.email} is already registered.`;
    templateVars.page = 'register';
    return res.render("login_register", templateVars);
  }
  users[credentials.userID] = {
    userID: credentials.userID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10),
  };
  req.session.userID = credentials.userID;
  saveToDataBase();
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/register");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});