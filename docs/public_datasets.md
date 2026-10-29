# Public research datasets

Life, Decoded currently computes personal insights from the user's own expense and task records. Public datasets below are research context, not replacements for personal records and not automatically joined to the app's users.

## Candidate sources

| Dataset | What it can support | Source |
|---|---|---|
| India Time Use Survey processed data | Population-level time-use patterns, subject to dataset coverage and provenance | https://github.com/Vonter/india-timeuse-survey |
| Household Consumption Expenditure Survey 2023–24 | Household expenditure context, not individual transaction timelines | https://microdata.gov.in/NADA/index.php/catalog/237/get-microdata |
| American Time Use Survey (ATUS) | Time-use patterns in the United States; different population and survey design | https://www.bls.gov/tus/data/datafiles-0325.htm |
| CFPB Financial Well-Being Survey | Financial well-being measures and survey context | https://www.consumerfinance.gov/data-research/financial-well-being-survey-data/ |
| Kaggle personal-finance transaction dataset | Potential schema/testing reference; verify the exact dataset page, uploader, terms, and data dictionary before use | https://www.kaggle.com/datasets/bukolafatunde/personal-finance |

## Integration rules

1. **Do not join these sources at the person level.** They do not share a verified participant identifier or a common longitudinal structure linking each person's spending transactions to task-overdue histories.
2. **Keep analyses separate.** Use public survey data for population context and the app's own records for within-user descriptive comparisons.
3. **Record provenance.** Every imported file should have a source URL, retrieval date, publisher, dataset version, license/terms, geographic coverage, sample design, field definitions, and any transformations.
4. **Do not imply causation.** Survey-level associations cannot validate the app's within-user claim and cannot establish that overdue tasks cause convenience-food spending.
5. **Validate before import.** Inspect the data dictionary, missingness, units/currency, date coverage, sampling weights, consent/privacy constraints, and license. Do not store raw public data in user tables.
6. **Keep public research data out of production user accounts.** Use a separate research namespace or offline analysis pipeline with a reproducible import manifest.

## Status

These are candidate research sources, **not currently integrated into the runtime insight engine**. Dataset access, licenses, column schemas, and current availability must be verified before implementing an importer. This explicit separation prevents a false claim that unrelated public datasets can be combined into a person's weekly spending/task history.
