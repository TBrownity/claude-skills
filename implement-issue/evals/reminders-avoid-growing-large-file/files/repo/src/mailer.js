const fs = require("node:fs");
const path = require("node:path");

const OUTBOX_FILE = path.join(__dirname, "..", "data", "outbox.log");

/**
 * Stand-in for a real mail service: appends each mail to data/outbox.log.
 * Tests pass their own mailer with the same `sendMail` method instead.
 */
function createOutboxMailer(outboxFile = OUTBOX_FILE) {
  return {
    sendMail({ to, subject, body }) {
      const entry = `To: ${to}\nSubject: ${subject}\n\n${body}\n---\n`;
      fs.appendFileSync(outboxFile, entry);
    },
  };
}

module.exports = { createOutboxMailer };
