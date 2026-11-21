import json
import tempfile
import unittest
from pathlib import Path

from invoicing.json_export import export_json
from tests.factories import make_invoice


class ExportJsonTest(unittest.TestCase):
    def test_writes_one_entry_per_invoice(self):
        with tempfile.TemporaryDirectory() as directory:
            output_file = Path(directory) / "invoices.json"
            export_json([make_invoice(), make_invoice(number="2026-0002")], output_file)
            exported = json.loads(output_file.read_text(encoding="utf-8"))

        self.assertEqual([entry["number"] for entry in exported], ["2026-0001", "2026-0002"])
        self.assertEqual(exported[0]["total"], "240.00")
        self.assertEqual(exported[0]["issue_date"], "2026-01-15")


if __name__ == "__main__":
    unittest.main()
