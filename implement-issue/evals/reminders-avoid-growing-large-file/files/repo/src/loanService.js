/**
 * Everything about members, books, loans, fines, reservations and reports.
 *
 * All functions work on a `library` object as loaded by store.js:
 *   { members: [...], books: [...], loans: [...], reservations: [...], payments: [...] }
 * Functions that change data mutate `library`; the caller saves it.
 * Dates are stored as ISO strings ("2026-03-14"). Functions that depend on
 * the current date take `now` as their last parameter, so tests can fix it.
 */

const LOAN_PERIOD_DAYS = 21;
const MAX_RENEWALS = 2;
const MAX_ACTIVE_LOANS = 5;
const FINE_PER_DAY_CENTS = 50;
const MAX_FINE_CENTS = 2000;
const SUSPENSION_FINE_LIMIT_CENTS = 1000;
const RESERVATION_HOLD_DAYS = 7;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

function parseDate(dateString) {
  return new Date(`${dateString}T00:00:00Z`);
}

function addDays(dateString, days) {
  const date = parseDate(dateString);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateString(date);
}

function daysBetween(fromDateString, toDateString_) {
  return Math.round((parseDate(toDateString_) - parseDate(fromDateString)) / MS_PER_DAY);
}

function today(now) {
  return toDateString(now);
}

// ---------------------------------------------------------------------------
// Ids and validation
// ---------------------------------------------------------------------------

function nextId(items, prefix) {
  const highest = items
    .map((item) => Number(item.id.slice(prefix.length)))
    .reduce((max, number) => Math.max(max, number), 0);
  return `${prefix}${highest + 1}`;
}

function assertPresent(value, message) {
  if (value === undefined || value === null || value === "") {
    throw new Error(message);
  }
}

function isValidEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

function findMember(library, memberId) {
  const member = library.members.find((candidate) => candidate.id === memberId);
  if (!member) {
    throw new Error(`Unknown member ${memberId}`);
  }
  return member;
}

function registerMember(library, { name, email }, now = new Date()) {
  assertPresent(name, "A member needs a name");
  if (!isValidEmail(email)) {
    throw new Error(`Invalid email address: ${email}`);
  }
  if (library.members.some((member) => member.email === email)) {
    throw new Error(`A member with ${email} already exists`);
  }
  const member = {
    id: nextId(library.members, "m"),
    name,
    email,
    joinedAt: today(now),
    suspended: false,
  };
  library.members.push(member);
  return member;
}

function updateMemberEmail(library, memberId, email) {
  if (!isValidEmail(email)) {
    throw new Error(`Invalid email address: ${email}`);
  }
  const member = findMember(library, memberId);
  member.email = email;
  return member;
}

function suspendMember(library, memberId, reason) {
  assertPresent(reason, "A suspension needs a reason");
  const member = findMember(library, memberId);
  member.suspended = true;
  member.suspensionReason = reason;
  return member;
}

function reactivateMember(library, memberId) {
  const member = findMember(library, memberId);
  member.suspended = false;
  delete member.suspensionReason;
  return member;
}

// ---------------------------------------------------------------------------
// Books
// ---------------------------------------------------------------------------

function findBook(library, bookId) {
  const book = library.books.find((candidate) => candidate.id === bookId);
  if (!book) {
    throw new Error(`Unknown book ${bookId}`);
  }
  return book;
}

function addBook(library, { title, author, isbn }) {
  assertPresent(title, "A book needs a title");
  assertPresent(author, "A book needs an author");
  const book = { id: nextId(library.books, "b"), title, author, isbn, retired: false };
  library.books.push(book);
  return book;
}

function retireBook(library, bookId) {
  const book = findBook(library, bookId);
  if (isOnLoan(library, bookId)) {
    throw new Error(`"${book.title}" is on loan and can't be retired`);
  }
  book.retired = true;
  return book;
}

function searchBooks(library, query) {
  const normalizedQuery = query.trim().toLowerCase();
  return library.books.filter(
    (book) =>
      !book.retired &&
      (book.title.toLowerCase().includes(normalizedQuery) ||
        book.author.toLowerCase().includes(normalizedQuery)),
  );
}

function isOnLoan(library, bookId) {
  return library.loans.some((loan) => loan.bookId === bookId && !loan.returnedAt);
}

// ---------------------------------------------------------------------------
// Loans
// ---------------------------------------------------------------------------

function findLoan(library, loanId) {
  const loan = library.loans.find((candidate) => candidate.id === loanId);
  if (!loan) {
    throw new Error(`Unknown loan ${loanId}`);
  }
  return loan;
}

function findActiveLoans(library, memberId) {
  return library.loans.filter((loan) => loan.memberId === memberId && !loan.returnedAt);
}

function isOverdue(loan, now = new Date()) {
  return !loan.returnedAt && loan.dueDate < today(now);
}

function findOverdueLoans(library, now = new Date()) {
  return library.loans.filter((loan) => isOverdue(loan, now));
}

function borrowBook(library, memberId, bookId, now = new Date()) {
  const member = findMember(library, memberId);
  const book = findBook(library, bookId);

  if (member.suspended) {
    throw new Error(`${member.name} is suspended: ${member.suspensionReason}`);
  }
  if (book.retired) {
    throw new Error(`"${book.title}" has been retired`);
  }
  if (isOnLoan(library, bookId)) {
    throw new Error(`"${book.title}" is already on loan`);
  }
  if (findActiveLoans(library, memberId).length >= MAX_ACTIVE_LOANS) {
    throw new Error(`${member.name} already has ${MAX_ACTIVE_LOANS} books on loan`);
  }
  const reservation = nextReservation(library, bookId, now);
  if (reservation && reservation.memberId !== memberId) {
    throw new Error(`"${book.title}" is reserved for another member`);
  }
  if (outstandingFineCents(library, memberId, now) > SUSPENSION_FINE_LIMIT_CENTS) {
    throw new Error(`${member.name} has unpaid fines above the limit`);
  }

  if (reservation) {
    reservation.fulfilledAt = today(now);
  }
  const loan = {
    id: nextId(library.loans, "l"),
    memberId,
    bookId,
    borrowedAt: today(now),
    dueDate: addDays(today(now), LOAN_PERIOD_DAYS),
    renewals: 0,
    returnedAt: null,
  };
  library.loans.push(loan);
  return loan;
}

function returnBook(library, loanId, now = new Date()) {
  const loan = findLoan(library, loanId);
  if (loan.returnedAt) {
    throw new Error(`Loan ${loanId} was already returned`);
  }
  loan.fineCents = calculateFine(loan, now);
  loan.returnedAt = today(now);

  const reservation = nextReservation(library, loan.bookId, now);
  if (reservation) {
    reservation.readySince = today(now);
  }
  return loan;
}

function renewLoan(library, loanId, now = new Date()) {
  const loan = findLoan(library, loanId);
  if (loan.returnedAt) {
    throw new Error(`Loan ${loanId} was already returned`);
  }
  if (isOverdue(loan, now)) {
    throw new Error(`Loan ${loanId} is overdue and can't be renewed`);
  }
  if (loan.renewals >= MAX_RENEWALS) {
    throw new Error(`Loan ${loanId} was already renewed ${MAX_RENEWALS} times`);
  }
  if (library.reservations.some((reservation) => isOpenReservationFor(reservation, loan.bookId))) {
    throw new Error(`The book of loan ${loanId} is reserved by another member`);
  }
  loan.renewals += 1;
  loan.dueDate = addDays(loan.dueDate, LOAN_PERIOD_DAYS);
  return loan;
}

function loansForMember(library, memberId) {
  return library.loans
    .filter((loan) => loan.memberId === memberId)
    .sort((first, second) => second.borrowedAt.localeCompare(first.borrowedAt));
}

// ---------------------------------------------------------------------------
// Fines
// ---------------------------------------------------------------------------

/**
 * The fine for a loan in cents: 50 cents per day after the due date, at most 20 euros.
 * For a returned loan, the fine stays what it was on the day of return.
 */
function calculateFine(loan, now = new Date()) {
  const endDate = loan.returnedAt || today(now);
  const daysLate = daysBetween(loan.dueDate, endDate);
  if (daysLate <= 0) {
    return 0;
  }
  return Math.min(daysLate * FINE_PER_DAY_CENTS, MAX_FINE_CENTS);
}

function formatCents(cents) {
  return `${(cents / 100).toFixed(2)} EUR`;
}

function totalFineCents(library, memberId, now = new Date()) {
  return library.loans
    .filter((loan) => loan.memberId === memberId)
    .reduce((sum, loan) => sum + calculateFine(loan, now), 0);
}

function paidCents(library, memberId) {
  return library.payments
    .filter((payment) => payment.memberId === memberId)
    .reduce((sum, payment) => sum + payment.amountCents, 0);
}

function outstandingFineCents(library, memberId, now = new Date()) {
  return Math.max(totalFineCents(library, memberId, now) - paidCents(library, memberId), 0);
}

function payFine(library, memberId, amountCents, now = new Date()) {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error("A payment must be a positive number of cents");
  }
  const outstanding = outstandingFineCents(library, memberId, now);
  if (amountCents > outstanding) {
    throw new Error(`Only ${formatCents(outstanding)} are outstanding`);
  }
  const payment = {
    id: nextId(library.payments, "p"),
    memberId,
    amountCents,
    paidAt: today(now),
  };
  library.payments.push(payment);
  return payment;
}

// ---------------------------------------------------------------------------
// Reservations
// ---------------------------------------------------------------------------

function isOpenReservationFor(reservation, bookId) {
  return reservation.bookId === bookId && !reservation.fulfilledAt && !reservation.cancelledAt;
}

function isExpiredReservation(reservation, now) {
  return (
    reservation.readySince && daysBetween(reservation.readySince, today(now)) > RESERVATION_HOLD_DAYS
  );
}

function reserveBook(library, memberId, bookId, now = new Date()) {
  const member = findMember(library, memberId);
  const book = findBook(library, bookId);
  if (member.suspended) {
    throw new Error(`${member.name} is suspended: ${member.suspensionReason}`);
  }
  if (book.retired) {
    throw new Error(`"${book.title}" has been retired`);
  }
  const alreadyReserved = library.reservations.some(
    (reservation) => isOpenReservationFor(reservation, bookId) && reservation.memberId === memberId,
  );
  if (alreadyReserved) {
    throw new Error(`${member.name} has already reserved "${book.title}"`);
  }
  const reservation = {
    id: nextId(library.reservations, "r"),
    memberId,
    bookId,
    reservedAt: today(now),
    readySince: isOnLoan(library, bookId) ? null : today(now),
    fulfilledAt: null,
    cancelledAt: null,
  };
  library.reservations.push(reservation);
  return reservation;
}

function cancelReservation(library, reservationId, now = new Date()) {
  const reservation = library.reservations.find((candidate) => candidate.id === reservationId);
  if (!reservation) {
    throw new Error(`Unknown reservation ${reservationId}`);
  }
  if (reservation.fulfilledAt || reservation.cancelledAt) {
    throw new Error(`Reservation ${reservationId} is no longer open`);
  }
  reservation.cancelledAt = today(now);
  return reservation;
}

/** The reservation that gets the book next, skipping reservations whose hold time ran out. */
function nextReservation(library, bookId, now = new Date()) {
  return library.reservations
    .filter((reservation) => isOpenReservationFor(reservation, bookId))
    .filter((reservation) => !isExpiredReservation(reservation, now))
    .sort((first, second) => first.reservedAt.localeCompare(second.reservedAt))[0];
}

function expireReservations(library, now = new Date()) {
  const expired = library.reservations.filter(
    (reservation) =>
      !reservation.fulfilledAt && !reservation.cancelledAt && isExpiredReservation(reservation, now),
  );
  for (const reservation of expired) {
    reservation.cancelledAt = today(now);
    reservation.cancelReason = "not picked up";
  }
  return expired;
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

function mostBorrowedBooks(library, limit = 10) {
  const loanCountByBook = new Map();
  for (const loan of library.loans) {
    loanCountByBook.set(loan.bookId, (loanCountByBook.get(loan.bookId) || 0) + 1);
  }
  return [...loanCountByBook.entries()]
    .sort((first, second) => second[1] - first[1])
    .slice(0, limit)
    .map(([bookId, loanCount]) => ({ book: findBook(library, bookId), loanCount }));
}

function memberHistory(library, memberId, now = new Date()) {
  const member = findMember(library, memberId);
  return {
    member,
    loans: loansForMember(library, memberId).map((loan) => ({
      ...loan,
      title: findBook(library, loan.bookId).title,
      fineCents: calculateFine(loan, now),
    })),
    outstandingFineCents: outstandingFineCents(library, memberId, now),
  };
}

function monthlyStatistics(library, yearMonth) {
  const inMonth = (dateString) => dateString && dateString.startsWith(yearMonth);
  return {
    month: yearMonth,
    loansStarted: library.loans.filter((loan) => inMonth(loan.borrowedAt)).length,
    loansReturned: library.loans.filter((loan) => inMonth(loan.returnedAt)).length,
    newMembers: library.members.filter((member) => inMonth(member.joinedAt)).length,
    finesPaidCents: library.payments
      .filter((payment) => inMonth(payment.paidAt))
      .reduce((sum, payment) => sum + payment.amountCents, 0),
  };
}

function overdueReport(library, now = new Date()) {
  return findOverdueLoans(library, now)
    .map((loan) => ({
      loanId: loan.id,
      member: findMember(library, loan.memberId).name,
      title: findBook(library, loan.bookId).title,
      dueDate: loan.dueDate,
      daysOverdue: daysBetween(loan.dueDate, today(now)),
      fineCents: calculateFine(loan, now),
    }))
    .sort((first, second) => second.daysOverdue - first.daysOverdue);
}

module.exports = {
  LOAN_PERIOD_DAYS,
  MAX_RENEWALS,
  MAX_ACTIVE_LOANS,
  addDays,
  daysBetween,
  today,
  findMember,
  registerMember,
  updateMemberEmail,
  suspendMember,
  reactivateMember,
  findBook,
  addBook,
  retireBook,
  searchBooks,
  isOnLoan,
  findLoan,
  findActiveLoans,
  isOverdue,
  findOverdueLoans,
  borrowBook,
  returnBook,
  renewLoan,
  loansForMember,
  calculateFine,
  formatCents,
  outstandingFineCents,
  payFine,
  reserveBook,
  cancelReservation,
  nextReservation,
  expireReservations,
  mostBorrowedBooks,
  memberHistory,
  monthlyStatistics,
  overdueReport,
};
