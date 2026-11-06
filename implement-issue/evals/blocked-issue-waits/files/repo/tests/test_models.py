import unittest
from decimal import Decimal

from invoicing.models import LineItem
from tests.factories import make_invoice


class InvoiceTotalTest(unittest.TestCase):
    def test_sums_all_line_items(self):
        invoice = make_invoice(
            line_items=[
                LineItem("Consulting", 3, Decimal("120.00")),
                LineItem("Travel expenses", 1, Decimal("86.40")),
            ]
        )
        self.assertEqual(invoice.total, Decimal("446.40"))

    def test_is_zero_without_line_items(self):
        self.assertEqual(make_invoice(line_items=[]).total, Decimal("0"))


if __name__ == "__main__":
    unittest.main()
