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

  for (let i in hashChars) {
    hashChars[i + 'b'] = (hashChars[i] % 100000) / 100000;
    hashChars[i] = (hashChars[i] % 1000) / 1000;
  }

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

hashString("hello world");

module.exports = { hashString };