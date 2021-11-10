function hashString(input) {
  let hashStr = "";
  let oneSh = 0;
  let twoSh = 0;
  let threeSh = 0;
  for (let i in input) {
    let n = input.charCodeAt(i);
    oneSh += n * n;
    twoSh += (i % 2) ? 1 : n * n;
    threeSh += (i % 3) ? 1 : n * n;
  }

  const lastDigits = (num) => {
    return Math.round((num % 1000) / 1000 * 62);
  }

  const secondLast = (num) => {
    return Math.round((num % 10000) / 10000 * 62);
  }

  const toAlphaNum = (num) => {
    if (num < 10) {
      return num + 48;
    } else if (num < 36) {
      return num + 55;
    } else {
      return num + 61;
    }
  }
  hashStr += String.fromCharCode(toAlphaNum(lastDigits(oneSh)));
  hashStr += String.fromCharCode(toAlphaNum(lastDigits(twoSh)));
  hashStr += String.fromCharCode(toAlphaNum(lastDigits(threeSh)));
  hashStr += String.fromCharCode(toAlphaNum(secondLast(oneSh)));
  hashStr += String.fromCharCode(toAlphaNum(secondLast(twoSh)));
  hashStr += String.fromCharCode(toAlphaNum(secondLast(threeSh)));
  return hashStr;
}