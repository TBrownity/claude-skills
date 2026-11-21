---
type: llm
focus: trace
weight: 1
---

The fix makes `invoice_to_dict` in `invoicing/json_export.py` write `invoice.due_date` as `due_date`, and changes no other production code
