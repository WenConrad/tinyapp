const { hashString } = require("./pseudoHash");
const fs = require('fs');
const inspect = require('util').inspect;
const { urlDatabase, users } = require('./server-data/database.js');

const getUserByEmail = function(email, database) {
  return database[hashString(email)];
};

const checkCookie = (cookie) => {
  if(users[cookie]) {
    return {
      email: users[cookie].email,
      session: cookie,
    }
  }
  return {session: null};
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

const saveToDataBase = () => {
  fs.writeFile('./server-data/database.js', `const urlDatabase = ${inspect(urlDatabase)};\nconst users = ${inspect(users)};\nmodule.exports = { urlDatabase, users };`, (err) => {
    if (err) throw err;
    console.log("Database updated");
  });
};

module.exports = { getUserByEmail, checkCookie, userDatabase, saveToDataBase };