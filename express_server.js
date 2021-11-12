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
  "v69tDP": {
    fullURL: "https://www.lighthouselabs.ca",
    userID: "twTy6d",
  },
  "i4xyhU": {
    fullURL: "https://www.google.com",
    userID: "twTy6d",
  }
};

const users = {
  "userID1": {
    id: "userID1",
    email: "useremail@email.com",
    password: "userpass",
  },
  "twTy6d": {
    id: "twTy6d",
    email: "conradwen@gmail.com",
    password: "kcmkMG",
  }
};

const templateVars = {
  users,
  session: null,
};

const readCookie = (req) => {
  let cooke = req.cookies;
  if (cooke.session) {
    templateVars.session = cooke.session;
    return true;
  }
  return false;
}

const checkUserAndPass = (req) => {
  const credentials = {
    userID: hashString(req.body.email),
    password: hashString(req.body.password),
    userExists: false,
    passMatch: false,
  }
  if (users[credentials.userID]) {
    credentials.userExists = true;
    if (credentials.password === users[credentials.userID].password) {
      credentials.passMatch = true;
    }
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
  templateVars.urls = {};
  if (!readCookie(req)) {
    return res.render("urls_index", templateVars);
  }
  for (let i in urlDatabase) {
    if (urlDatabase[i].userID === templateVars.session) {
      templateVars.urls[i] = urlDatabase[i];
    }
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (readCookie(req)) {
    return res.render("urls_new", templateVars);
  }
  res.redirect("/register");
});

app.post("/urls", (req, res) => {
  if (!readCookie(req)) {
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
  templateVars.shortURL = req.params.shortURL;
  templateVars.longURL = urlDatabase[req.params.shortURL].fullURL;
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/edit", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  let shortURLNew = hashString(req.body.update);
  urlDatabase[shortURLNew] = {
    fullURL: req.body.update,
    userID: templateVars[session],
  }
  res.redirect(`/urls/${shortURLNew}`);
})

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].fullURL;
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  if (readCookie(req)) {
    return res.redirect("/urls");
  }
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
    password: credentials.password,
  }
  res.cookie("session", credentials.userID);
  res.render("login_register", templateVars);
})

app.post("/login", (req, res) => {
  credentials = checkUserAndPass(req);
  if (credentials.passMatch) {
    res.cookie("session", credentials.userID);
    return res.redirect("/urls");
  }
  if (credentials.userExists) {
    res.status(401);
    return res.send("Wrong password bruh");
  }
  res.status(401);
  res.send("email not registered")
});

app.post("/logout", (req, res) => {
  res.clearCookie('session');
  templateVars.session = null;
  res.redirect("/register");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});