# invoicing

Small command line tool to list and export our invoices.

## Usage

```sh
python -m invoicing list
python -m invoicing export --format json --output invoices.json
```

`--data <file>` reads invoices from another data file (default: `data/invoices.json`).

## Development

Requires Python 3.11 or later, no dependencies.

```sh
python -m unittest        # run all tests
ruff check .              # lint
ruff format --check .     # check formatting
```
