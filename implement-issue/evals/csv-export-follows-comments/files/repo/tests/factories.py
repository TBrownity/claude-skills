"""Builders for test data."""

from datetime import date
from decimal import Decimal

from invoicing.models import Customer, Invoice, InvoiceStatus, LineItem


def make_customer(**overrides) -> Customer:
    values = {
        "customer_id": "c1",
        "name": "Nordlicht Design",
        "email": "hello@nordlicht.design",
        "customer_since": date(2022, 1, 10),
    }
    values.update(overrides)
    return Customer(**values)


def make_invoice(**overrides) -> Invoice:
    values = {
        "number": "2026-0001",
        "customer": make_customer(),
        "issue_date": date(2026, 1, 15),
        "due_date": date(2026, 2, 14),
        "status": InvoiceStatus.SENT,
        "line_items": [LineItem("Consulting", 2, Decimal("120.00"))],
    }
    values.update(overrides)
    return Invoice(**values)
