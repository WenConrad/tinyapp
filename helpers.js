const { hashString } = require("./pseudoHash");
const fs = require('fs');
const inspect = require('util').inspect;
const { urlDatabase, users } = require('./server-data/database.js');
const bcrypt = require('bcryptjs');

const checkCookie = (cookie) => {
  if(users[cookie]) {
    return {
      email: users[cookie].email,
      session: cookie,
      notice: null,
    }
  }
  return {session: null, notice: null };
};

const userDatabase = (userID) => {
  let databaseUser = {};
  for (let i in urlDatabase) {
    if (urlDatabase[i].userID === userID) {
      databaseUser[i] = urlDatabase[i];
    }
  }
  return databaseUser;
}

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

const saveToDataBase = () => {
  fs.writeFile('./server-data/database.js', `const urlDatabase = ${inspect(urlDatabase)};\nconst users = ${inspect(users)};\nmodule.exports = { urlDatabase, users };`, (err) => {
    if (err) throw err;
    console.log("Database updated");
  });
};

module.exports = { checkCookie, userDatabase, checkUserAndPass, saveToDataBase };