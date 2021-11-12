const { hashString } = require("./pseudoHash");

const getUserByEmail = function(email, database) {
  return database[hashString(email)];
};