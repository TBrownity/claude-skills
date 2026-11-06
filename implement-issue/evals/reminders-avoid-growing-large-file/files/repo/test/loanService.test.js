const test = require("node:test");
const assert = require("node:assert/strict");

const loanService = require("../src/loanService");
const { makeLibrary } = require("./fixtures");

const NOW = new Date("2026-11-06T10:00:00Z");

test("borrowing sets the due date three weeks ahead", () => {
  const library = makeLibrary();
  const loan = loanService.borrowBook(library, "m1", "b1", NOW);
  assert.equal(loan.dueDate, "2026-11-27");
});

test("a book on loan can't be borrowed again", () => {
  const library = makeLibrary();
  loanService.borrowBook(library, "m1", "b1", NOW);
  assert.throws(() => loanService.borrowBook(library, "m2", "b1", NOW), /already on loan/);
});

test("the fine is 50 cents per day late, capped at 20 euros", () => {
  const loan = { dueDate: "2026-11-01", returnedAt: null };
  assert.equal(loanService.calculateFine(loan, NOW), 250);
  assert.equal(loanService.calculateFine({ dueDate: "2026-01-01", returnedAt: null }, NOW), 2000);
});

test("a returned loan keeps the fine of its return day", () => {
  const loan = { dueDate: "2026-11-01", returnedAt: "2026-11-03" };
  assert.equal(loanService.calculateFine(loan, NOW), 100);
});

test("only unreturned loans past their due date are overdue", () => {
  const library = makeLibrary();
  library.loans.push(
    { id: "l1", memberId: "m1", bookId: "b1", dueDate: "2026-11-01", returnedAt: null },
    { id: "l2", memberId: "m1", bookId: "b2", dueDate: "2026-11-01", returnedAt: "2026-11-02" },
    { id: "l3", memberId: "m2", bookId: "b2", dueDate: "2026-11-06", returnedAt: null },
  );
  assert.deepEqual(
    loanService.findOverdueLoans(library, NOW).map((loan) => loan.id),
    ["l1"],
  );
});

test("an overdue loan can't be renewed", () => {
  const library = makeLibrary();
  library.loans.push({ id: "l1", memberId: "m1", bookId: "b1", dueDate: "2026-11-01", renewals: 0, returnedAt: null });
  assert.throws(() => loanService.renewLoan(library, "l1", NOW), /overdue/);
});
