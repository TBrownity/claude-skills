const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { runCommand } = require("../src/cli");
const { DEFAULT_DATA_FILE } = require("../src/store");

const NOW = new Date("2026-11-06T10:00:00Z");

function copyOfSampleData() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "library-"));
  const dataFile = path.join(directory, "library.json");
  fs.copyFileSync(DEFAULT_DATA_FILE, dataFile);
  return dataFile;
}

test("overdue lists the overdue loans, most overdue first", () => {
  const output = runCommand(["overdue"], { dataFile: copyOfSampleData(), now: NOW });
  const loanIds = output.split("\n").map((line) => line.split(" ")[0]);
  assert.deepEqual(loanIds, ["l5", "l2", "l3"]);
});

test("borrow saves the new loan", () => {
  const dataFile = copyOfSampleData();
  runCommand(["borrow", "m3", "b6"], { dataFile, now: NOW });
  const library = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  assert.equal(library.loans.at(-1).bookId, "b6");
});

test("an unknown command explains the usage", () => {
  assert.throws(() => runCommand(["dance"], { dataFile: copyOfSampleData(), now: NOW }), /Usage:/);
});
