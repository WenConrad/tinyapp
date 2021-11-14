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
const { userDatabase, checkCookie, saveToDataBase } = require("./helpers");

const checkUserAndPass = (req) => {
  const credentials = {
    userID: hashString(req.body.email),
    userExists: false,
    passMatch: false,
  }
  if (users[credentials.userID]) {
    credentials.userExists = true;
    credentials.passMatch = bcrypt.compareSync(req.body.password, users[credentials.userID].password);
  }
  return credentials;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = checkCookie(req.session.user_id);
  templateVars.urls = userDatabase(req.session.user_id);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    let templateVars = checkCookie(req.session.user_id);
    return res.render("urls_new", templateVars);
  }
  res.redirect("/register");
});

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("register");
  }
  let shortURL = hashString(req.body.longURL); //should we check if longURL is a valid URL? maybe implement this later
  urlDatabase[shortURL] = {
    fullURL: req.body.longURL,
    userID: req.session.user_id,
  }
  saveToDataBase();
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = checkCookie(req.session.user_id);
  templateVars.urls = userDatabase(req.session.user_id);
  if (urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
    return res.render("login_register", templateVars);
  }
  templateVars.shortURL = req.params.shortURL;
  templateVars.longURL = urlDatabase[req.params.shortURL].fullURL;
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/edit", (req, res) => {
  if (urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
    return res.render("login_register", templateVars);
  }
  delete urlDatabase[req.params.shortURL];
  let shortURLNew = hashString(req.body.update);
  urlDatabase[shortURLNew] = {
    fullURL: req.body.update,
    userID: templateVars[session],
  }
  saveToDataBase();
  res.redirect(`/urls/${shortURLNew}`);
})

app.post("/urls/:shortURL/delete", (req, res) => {
  if (urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
    return res.render("login_register", templateVars);
  }
  delete urlDatabase[req.params.shortURL];
  saveToDataBase();
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].fullURL;
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  let templateVars = checkCookie(req.session.user_id);
  templateVars.notice = null;
  res.render("login_register", templateVars);
})

app.post("/register", (req, res) => {
  let templateVars = checkCookie(req.session.user_id);
  templateVars.urls = userDatabase(req.session.user_id);
  credentials = checkUserAndPass(req);
  if (credentials.userExists) {
    templateVars.notice = `${req.body.email} is already registered.`
    return res.render("login_register", templateVars)
  }
  users[credentials.userID] = {
    userID: credentials.userID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10),
  }
  req.session.user_id = credentials.userID;
  saveToDataBase();
  res.redirect("/urls");
})

app.post("/login", (req, res) => {
  let templateVars = { session: null };
  credentials = checkUserAndPass(req);
  if (credentials.passMatch) {
    req.session.user_id = credentials.userID;
    return res.redirect("/urls");
  }
  templateVars.notice = `${req.body.email} is not a registered user.`
  if (credentials.userExists) {
    templateVars.notice = "Login Failed: Password Incorrect"
  }
  return res.render("login_register", templateVars)
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/register");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});