"""Loads invoices from the JSON data file."""

import json
from datetime import date
from decimal import Decimal
from pathlib import Path

from invoicing.models import Customer, Invoice, InvoiceStatus, LineItem

DEFAULT_DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "invoices.json"


def load_invoices(data_file: Path = DEFAULT_DATA_FILE) -> list[Invoice]:
    raw = json.loads(data_file.read_text(encoding="utf-8"))
    customers = {entry["id"]: _parse_customer(entry) for entry in raw["customers"]}
    return [_parse_invoice(entry, customers) for entry in raw["invoices"]]


def _parse_customer(entry: dict) -> Customer:
    return Customer(
        customer_id=entry["id"],
        name=entry["name"],
        email=entry["email"],
        customer_since=date.fromisoformat(entry["customer_since"]),
    )


def _parse_invoice(entry: dict, customers: dict[str, Customer]) -> Invoice:
    return Invoice(
        number=entry["number"],
        customer=customers[entry["customer_id"]],
        issue_date=date.fromisoformat(entry["issue_date"]),
        due_date=date.fromisoformat(entry["due_date"]),
        status=InvoiceStatus(entry["status"]),
        line_items=[
            LineItem(
                description=item["description"],
                quantity=item["quantity"],
                unit_price=Decimal(item["unit_price"]),
            )
            for item in entry["line_items"]
        ],
    )
