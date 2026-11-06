"""Command line interface: `python -m invoicing <command>`."""

import argparse
from pathlib import Path

from invoicing.json_export import export_json
from invoicing.models import Invoice
from invoicing.repository import DEFAULT_DATA_FILE, load_invoices

EXPORT_FORMATS = {"json": export_json}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="invoicing")
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA_FILE, help="invoice data file")
    commands = parser.add_subparsers(dest="command", required=True)

    commands.add_parser("list", help="list all invoices")

    export = commands.add_parser("export", help="export all invoices to a file")
    export.add_argument("--format", choices=sorted(EXPORT_FORMATS), required=True)
    export.add_argument("--output", type=Path, required=True)
    return parser


def format_invoice_line(invoice: Invoice) -> str:
    return (
        f"{invoice.number}  {invoice.customer.name:<32} "
        f"{invoice.total:>10.2f}  {invoice.status.value}"
    )


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    invoices = load_invoices(args.data)

    if args.command == "list":
        for invoice in invoices:
            print(format_invoice_line(invoice))
    elif args.command == "export":
        EXPORT_FORMATS[args.format](invoices, args.output)
        print(f"Exported {len(invoices)} invoices to {args.output}")
    return 0
