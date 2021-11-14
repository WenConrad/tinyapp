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
const { userDatabase, checkCookie } = require("./helpers");

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
    userID: templateVars[session],
  }
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
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
  res.redirect(`/urls/${shortURLNew}`);
})

app.post("/urls/:shortURL/delete", (req, res) => {
  if (urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
    return res.render("login_register", templateVars);
  }
  delete urlDatabase[req.params.shortURL];
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
  let templateVars = {session: null};
  res.render("login_register", templateVars);
})

app.post("/register", (req, res) => {
  credentials = checkUserAndPass(req);
  if (credentials.userExists) {
    res.status(409);
    return res.send("email is already registered");
  }
  users[credentials.userID] = {
    userID: credentials.userID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10),
  }
  req.session.user_id = credentials.userID;
  templateVars.session = credentials.userID;
  res.render("login_register", templateVars);
})

app.post("/login", (req, res) => {
  credentials = checkUserAndPass(req);
  if (credentials.passMatch) {
    req.session.user_id = credentials.userID;
    templateVars = {session: credentials.userID, users};
    return res.redirect("/urls");
  }
  if (credentials.userExists) {
    res.status(401);
    return res.send(bcrypt.hashSync("hunter2", 10));
  }
  res.status(401);
  res.send("email not registered")
});

app.post("/logout", (req, res) => {
  req.session = null;
  templateVars.session = null;
  res.redirect("/register");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});