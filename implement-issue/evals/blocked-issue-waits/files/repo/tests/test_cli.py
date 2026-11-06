import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path

from invoicing.cli import main
from invoicing.repository import DEFAULT_DATA_FILE


class CliTest(unittest.TestCase):
    def test_list_prints_one_line_per_invoice(self):
        output = io.StringIO()
        with redirect_stdout(output):
            main(["--data", str(DEFAULT_DATA_FILE), "list"])
        self.assertEqual(len(output.getvalue().splitlines()), 5)

    def test_export_json_writes_file(self):
        with tempfile.TemporaryDirectory() as directory:
            output_file = Path(directory) / "out.json"
            with redirect_stdout(io.StringIO()):
                main(["export", "--format", "json", "--output", str(output_file)])
            self.assertEqual(len(json.loads(output_file.read_text(encoding="utf-8"))), 5)


if __name__ == "__main__":
    unittest.main()
