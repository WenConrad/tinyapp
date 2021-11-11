const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

const urlDatabase = {
  "v69tDP": "https://www.lighthouselabs.ca",
  "i4xyhU": "https://www.google.com"
};

const { hashString } = require("./pseudoHash");

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
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  console.log(req.body);
  let shortURL = hashString(req.body.longURL); //should we check if longURL is a valid URL? maybe implement this later
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
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

app.post("/login", (req, res) => {
  console.log(req.body);
  res.cookie('username', req.body.userName);
  res.redirect("/urls");
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});