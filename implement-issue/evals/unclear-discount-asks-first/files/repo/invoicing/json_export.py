"""Exports invoices as JSON."""

import json
from pathlib import Path

from invoicing.models import Invoice


def invoice_to_dict(invoice: Invoice) -> dict:
    return {
        "number": invoice.number,
        "customer": invoice.customer.name,
        "issue_date": invoice.issue_date.isoformat(),
        "due_date": invoice.due_date.isoformat(),
        "status": invoice.status.value,
        "total": f"{invoice.total:.2f}",
        "line_items": [
            {
                "description": item.description,
                "quantity": item.quantity,
                "unit_price": f"{item.unit_price:.2f}",
            }
            for item in invoice.line_items
        ],
    }


def export_json(invoices: list[Invoice], output_file: Path) -> None:
    payload = [invoice_to_dict(invoice) for invoice in invoices]
    output_file.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
