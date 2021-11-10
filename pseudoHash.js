const hashString = (input) => {
  let hashStr = "";
  let hashChars = {
    ch1: 0,
    ch2: 0,
    ch3: 0
  };

  for (let i in input) {
    let n = input.charCodeAt(i);
    hashChars.ch1 += n * n;
    hashChars.ch2 += (i % 2) ? 1 : n * n;
    hashChars.ch3 += (i % 3) ? 1 : n * n;
  }

  hashChars.ch4 = (hashChars.ch1 % 10000) / 10000;
  hashChars.ch5 = (hashChars.ch2 % 10000) / 10000;
  hashChars.ch6 = (hashChars.ch3 % 10000) / 10000;
  hashChars.ch1 = (hashChars.ch1 % 1000) / 1000;
  hashChars.ch2 = (hashChars.ch2 % 1000) / 1000;
  hashChars.ch3 = (hashChars.ch3 % 1000) / 1000;

  const toAlphaNum = (num) => {
    if (num < 10) {
      return num + 48;
    } else if (num < 36) {
      return num + 55;
    } else {
      return num + 61;
    }
  };

  for (let i in hashChars) {
    hashStr += String.fromCharCode(toAlphaNum(hashChars[i] * 62));
  }

  return hashStr;
};

module.exports = { hashString };