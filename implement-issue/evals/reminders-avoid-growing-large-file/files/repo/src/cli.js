const { DEFAULT_DATA_FILE, loadLibrary, saveLibrary } = require("./store");
const loanService = require("./loanService");

const COMMANDS = {
  borrow: {
    usage: "borrow <memberId> <bookId>",
    changesData: true,
    run(library, [memberId, bookId], now) {
      const loan = loanService.borrowBook(library, memberId, bookId, now);
      return `Loan ${loan.id} created, due on ${loan.dueDate}`;
    },
  },
  return: {
    usage: "return <loanId>",
    changesData: true,
    run(library, [loanId], now) {
      const loan = loanService.returnBook(library, loanId, now);
      const fine = loan.fineCents > 0 ? `, fine ${loanService.formatCents(loan.fineCents)}` : "";
      return `Loan ${loan.id} returned${fine}`;
    },
  },
  renew: {
    usage: "renew <loanId>",
    changesData: true,
    run(library, [loanId], now) {
      const loan = loanService.renewLoan(library, loanId, now);
      return `Loan ${loan.id} renewed, now due on ${loan.dueDate}`;
    },
  },
  overdue: {
    usage: "overdue",
    changesData: false,
    run(library, _args, now) {
      const rows = loanService.overdueReport(library, now);
      if (rows.length === 0) {
        return "No overdue loans";
      }
      return rows
        .map(
          (row) =>
            `${row.loanId}  ${row.title} (${row.member}), due ${row.dueDate}, ` +
            `${row.daysOverdue} days late, fine ${loanService.formatCents(row.fineCents)}`,
        )
        .join("\n");
    },
  },
};

function usage() {
  return ["Usage:", ...Object.values(COMMANDS).map((command) => `  node src/cli.js ${command.usage}`)].join(
    "\n",
  );
}

/** Runs one command against the data file and returns what to print. */
function runCommand(argv, { dataFile = DEFAULT_DATA_FILE, now = new Date() } = {}) {
  const [commandName, ...args] = argv;
  const command = COMMANDS[commandName];
  if (!command) {
    throw new Error(`Unknown command: ${commandName}\n${usage()}`);
  }
  const library = loadLibrary(dataFile);
  const output = command.run(library, args, now);
  if (command.changesData) {
    saveLibrary(library, dataFile);
  }
  return output;
}

if (require.main === module) {
  try {
    console.log(runCommand(process.argv.slice(2)));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { runCommand };
