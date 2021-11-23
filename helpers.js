const { hashString } = require("./pseudoHash");
const fs = require('fs');
const inspect = require('util').inspect;
const { urlDatabase, users } = require('./server-data/database.js');
const bcrypt = require('bcryptjs');

const checkCookie = (cookie) => { //checks cookie session and returns data for use by other functions
  if(users[cookie]) {
    return {
      email: users[cookie].email, //used to filter database for shortURLs owned by user
      session: cookie, //used by header.ejs to render user session status
      notice: null, //used by header.ejs so that no alert banner wil be displayed
    }
  }
  return {session: null, notice: null };
};

const userURLs = (userID) => { //filter database to return list of shortURLs owned by the active session user
  let databaseUser = {};
  for (const i in urlDatabase) {
    if (urlDatabase[i].userID === userID) {
      databaseUser[i] = urlDatabase[i];
    }
  }
  return databaseUser;
}

const checkUserAndPass = (req) => { //check database for user and password info, returns object for use in other functions
  const credentials = {
    userID: hashString(req.body.email), //will be assigned to generate a cookie
    userExists: false, //assigned default case of false
    passMatch: false, //assigned default case of false
  }
  if (users[credentials.userID]) {
    credentials.userExists = true; //default case of false overwritten if user is in database
    credentials.passMatch = bcrypt.compareSync(req.body.password, users[credentials.userID].password); //if user exists check hash of password match, true or false assigned
  }
  return credentials;
};

const saveToDataBase = () => { //writes to file a template literal containing objects that hold user and shortURL info
  fs.writeFile('./server-data/database.js', `const urlDatabase = ${inspect(urlDatabase)};\nconst users = ${inspect(users)};\nmodule.exports = { urlDatabase, users };`, (err) => {
    if (err) throw err;
    console.log("Database updated");
  });
};

module.exports = { checkCookie, userURLs, checkUserAndPass, saveToDataBase };