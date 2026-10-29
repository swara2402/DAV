# Real transaction and task data

## Import actual spending records

From the Personal workspace, choose **Import CSV** on the dashboard. The import is for a CSV statement that the user exports from their own bank or card provider; the app does not connect to a bank, request credentials, or fetch account records automatically.

The importer accepts up to 5 MB / 5,000 rows. Supported header names include:

- Date: `date`, `transaction_date`, `txn_date`, `value_date`, or `posting_date`
- Description: `description`, `narration`, `merchant`, `details`, `transaction_details`, or `particulars`
- Amount: `amount` or `transaction_amount`; alternatively `debit`, `withdrawal`, `withdrawals`, or `debit_amount`
- Optional category: `category` or `expense_category`
- Optional credit/deposit column: rows with credits are skipped when a separate debit/credit format is detected.

Date parsing prefers ISO `YYYY-MM-DD` or Indian `DD/MM/YYYY` formats. The importer skips blank/non-positive amounts and duplicate lines within the same file. It does not deduplicate against existing records because two genuine purchases can have the same date, amount, and merchant. Categories are taken from valid supplied values or inferred from common merchant/description keywords; unfamiliar records become `other`. Review categories, especially convenience-food classifications, after import.

Every imported expense is tagged with `data_source=bank_csv_import` and attached to the authenticated workspace's `user_id`. Imported rows are not generated from the public time-use survey and are never attached to Maya or Arjun's shared synthetic personas.

## Workspace and privacy boundary

The Personal workspace uses a server-signed, random anonymous session ID in demo/development mode so its records are isolated from other workspaces. Its bearer token expires after 90 days; there is no account recovery or cross-device sync for this anonymous workspace. It is not a registered account and is not an appropriate place to upload sensitive statements on a public hosted demo. Use a locally hosted instance for private testing, or implement and configure real Supabase Auth for a deployed product.

## Tasks and the behavioral insight

Tasks are still recorded in the same user's workspace through the app's task interface. The app does not manufacture overdue tasks from bank statements or join unrelated public survey respondents to financial transactions. To calculate the task-overload/spending association, import real spending history and enter the corresponding real task due dates/completion dates for the same workspace. If either history is incomplete, the engine should continue to report insufficient data rather than invent a result.

The India Time Use Survey and Household Consumption Expenditure Survey are genuine population survey sources, but neither should be treated as a person's linked bank statement plus task history. Public survey data is useful for separate descriptive analysis, not as a replacement for an individual's records.
