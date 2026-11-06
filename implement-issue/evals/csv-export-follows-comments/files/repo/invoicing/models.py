"""Domain models for invoices."""

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from enum import Enum


class InvoiceStatus(Enum):
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"


@dataclass(frozen=True)
class Customer:
    customer_id: str
    name: str
    email: str
    customer_since: date


@dataclass(frozen=True)
class LineItem:
    description: str
    quantity: int
    unit_price: Decimal

    @property
    def amount(self) -> Decimal:
        return self.unit_price * self.quantity


@dataclass
class Invoice:
    number: str
    customer: Customer
    issue_date: date
    due_date: date
    status: InvoiceStatus
    line_items: list[LineItem] = field(default_factory=list)

    @property
    def total(self) -> Decimal:
        return sum((item.amount for item in self.line_items), Decimal("0"))
