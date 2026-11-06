# library-loans

Loans, reservations and fines for the town library. Data lives in `data/library.json`.

## Usage

```sh
node src/cli.js borrow <memberId> <bookId>
node src/cli.js return <loanId>
node src/cli.js renew <loanId>
node src/cli.js overdue          # list overdue loans
```

Emails are not sent for real yet: `src/mailer.js` appends them to `data/outbox.log`.

## Development

Node 20 or later, no dependencies.

```sh
npm test        # node --test
npm run lint    # eslint
```
