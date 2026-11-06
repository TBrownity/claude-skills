const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_DATA_FILE = path.join(__dirname, "..", "data", "library.json");

function loadLibrary(dataFile = DEFAULT_DATA_FILE) {
  return JSON.parse(fs.readFileSync(dataFile, "utf8"));
}

function saveLibrary(library, dataFile = DEFAULT_DATA_FILE) {
  fs.writeFileSync(dataFile, JSON.stringify(library, null, 2) + "\n");
}

module.exports = { DEFAULT_DATA_FILE, loadLibrary, saveLibrary };
