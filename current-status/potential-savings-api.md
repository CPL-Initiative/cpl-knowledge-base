---
type: "reference"
category: "reference"
project: "cpl-initiative"
date: "2026-07-01"
created: "2026-07-01"
source: "cpl_dashboard_potential_savings_api_notes1.md"
curation: "promote — documents the public MAP CPL Insights API (current-status/)"
tags: ["#resource", "#cpl", "#reference", "#api", "#dashboard", "#map-platform", "#live-data", "#jst"]
relevance: "high"
---

# CPL Dashboard Potential Savings API — Reference Notes

## Purpose

This API returns the CPL dashboard data currently displayed on the main dashboard UI. It can be used to get far more than just the Mil/JST numbers, including statewide totals, college-level totals, savings, impact, units, students, transcribed units, and military/JST tracking.

The original request for **Mil/JST numbers** maps to:

- `EnrolledMilitaryStudents` = Mil
- `VeteransWithJSTs` = JST

Example display: `100/120` would mean:

```txt
EnrolledMilitaryStudents / VeteransWithJSTs
```

## API Request

```txt
Endpoint:
https://cpldashboardcccco.azurewebsites.net/api/potential-savings?cpltype=0&indExcludeSA=0

Method:
GET

Headers:
Accept: application/json, text/plain, */*

Body:
None
```

## cURL

```bash
curl -i \
  "https://cpldashboardcccco.azurewebsites.net/api/potential-savings?cpltype=0&indExcludeSA=0" \
  -H "Accept: application/json, text/plain, */*"
```

## JavaScript Fetch

```js
const API_URL =
  "https://cpldashboardcccco.azurewebsites.net/api/potential-savings?cpltype=0&indExcludeSA=0";

const res = await fetch(API_URL, {
  method: "GET",
  headers: {
    Accept: "application/json, text/plain, */*"
  },
  cache: "no-store"
});

if (!res.ok) {
  throw new Error(`API responded with status ${res.status}`);
}

const data = await res.json();
```

## Response Shape

The API returns a full array of dashboard records.

Expected row pattern:

```txt
data[0] = Count / placeholder row
data[1] = ALL COLLEGES statewide totals row
data[2+] = Individual college rows
```

The widget script uses:

```js
renderCards(data[1]);
```

So for statewide totals, use:

```js
const statewideTotals = data.find(x => x.College === "ALL COLLEGES") || data[1];
```

For individual colleges:

```js
const collegeRows = data.filter(x => x.College && x.College !== "Count" && x.College !== "ALL COLLEGES");
```

## Example Response Records

```json
[
  {
    "Sorder": -1,
    "College": "Count",
    "CollegeID": 0,
    "EnrolledMilitaryStudents": 0,
    "VeteransWithJSTs": 0
  },
  {
    "Sorder": 1,
    "College": "ALL COLLEGES",
    "CollegeID": 0,
    "Savings": 321229590.25,
    "YearImpact": 1299390447.3999999,
    "Units": 230440.65000000002,
    "Students": 48213,
    "AverageUnits": 4.779637234770705,
    "MilitaryCredits": 114248.5,
    "NonMilitaryCredits": 121633.45,
    "ApprenticeshipCredits": 6428.4,
    "TranscribedUnits": 99534.95,
    "MilitaryStudents": 24875,
    "NonMilitaryStudents": 23414,
    "AprenticeStudents": 753,
    "EnrolledMilitaryStudents": 34135,
    "VeteransWithJSTs": 23543,
    "StarCollegeCount": 50,
    "EnrolledToJSTRatio": 1,
    "MoreJSTsThanEnrolled": 0
  },
  {
    "Sorder": 2,
    "College": "Merced College",
    "CollegeID": 79,
    "Savings": 20069375,
    "YearImpact": 95211710,
    "Units": 19603,
    "Students": 3340,
    "AverageUnits": 5.869161676646707,
    "MilitaryCredits": 1340,
    "NonMilitaryCredits": 18263,
    "ApprenticeshipCredits": 132,
    "TranscribedUnits": 19438,
    "MilitaryStudents": 269,
    "NonMilitaryStudents": 3073,
    "AprenticeStudents": 20,
    "EnrolledMilitaryStudents": 142,
    "VeteransWithJSTs": 264,
    "EnrolledToJSTRatio": 0,
    "MoreJSTsThanEnrolled": 1
  }
]
```

> The values above are illustrative of the response shape. Live figures change daily — always read them from the endpoint, never hard-code them.

## Key Fields

| Field | Meaning |
|---|---|
| `College` | Row label; includes `Count`, `ALL COLLEGES`, and college names |
| `CollegeID` | College identifier |
| `Savings` | Estimated student savings |
| `YearImpact` | Estimated 20-year impact |
| `Combined` | Savings + impact combined |
| `Units` | Eligible CPL units |
| `Students` | Students served |
| `AverageUnits` | Average eligible units per student |
| `MilitaryCredits` | Eligible military units |
| `NonMilitaryCredits` | Eligible workforce/non-military units |
| `ApprenticeshipCredits` | Eligible apprenticeship units |
| `TranscribedUnits` | Total transcribed CPL units |
| `TranscribedMilitaryUnits` | Transcribed military units |
| `TranscribedNonMilitaryUnits` | Transcribed workforce/non-military units |
| `TranscribedApprenticeshipUnits` | Transcribed apprenticeship units |
| `MilitaryStudents` | Military students served |
| `NonMilitaryStudents` | Workforce/non-military students served |
| `AprenticeStudents` | Apprentice students served; field is misspelled in API/script |
| `AreaCredits` | Area-level credits |
| `CourseCredits` | Course-level credits |
| `ElectiveCredits` | Elective credits |
| `TranscribedAverage` | Average transcribed units |
| `EnrolledMilitaryStudents` | Mil count for Mil/JST display |
| `VeteransWithJSTs` | JST count for Mil/JST display |
| `StarCollegeCount` | Count of star colleges, meaningful on statewide row |
| `EnrolledToJSTRatio` | Ratio/bucket indicator for enrolled military vs JSTs |
| `MoreJSTsThanEnrolled` | Flag where JST count exceeds enrolled military count |

## Mil/JST Extraction

```js
function getMilJst(row) {
  return {
    college: row.College,
    mil: row.EnrolledMilitaryStudents,
    jst: row.VeteransWithJSTs,
    display: `${row.EnrolledMilitaryStudents}/${row.VeteransWithJSTs}`
  };
}

const milJstByCollege = data
  .filter(x => x.College && x.College !== "Count" && x.College !== "ALL COLLEGES")
  .map(getMilJst);
```

## Dashboard Widget Notes

The existing widget only renders `data[1]`, the `ALL COLLEGES` row, for summary cards.

The API itself is richer than the widget usage. A tool should prefer this API over scraping the dashboard UI because the response already contains the full structured dataset.

## Integration Checklist

1. Use `GET`.
2. Do not send a request body.
3. Confirm the response is an array.
4. Treat `data[1]` or `College === "ALL COLLEGES"` as statewide totals.
5. Treat `data[2+]` as college-level records, excluding `Count` and `ALL COLLEGES`.
6. Use `EnrolledMilitaryStudents` and `VeteransWithJSTs` for Mil/JST numbers.
7. Preserve the misspelled field name `AprenticeStudents`.
8. Prefer API parsing over UI scraping.
