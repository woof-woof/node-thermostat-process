function logError(error, title) {
  console.error(title, error);
}

function logD(...args) {
  console.log(...args);
}

module.exports = {
  logError,
  logD,
};
