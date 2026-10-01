# GRC Dashboard

A lightweight Governance, Risk & Compliance dashboard. It is plain HTML, CSS and JavaScript, with no build step and no dependencies.

## Run it

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000   # then visit http://localhost:8000
```

## What's in it

| Tab | Contents |
|---|---|
| **Overview** | KPI tiles (overall compliance, high/critical risks, open findings, overdue policy reviews), compliance by framework, a 5×5 risk heat map, an open/overdue findings trend and the top risks |
| **Risk register** | Search, filter, sort, add, edit, change status and export to CSV. Clicking a heat-map cell filters this list |
| **Compliance** | Control library across ISO 27001, SOC 2, NIST CSF 2.0 and GDPR, with implementation status and last test date |
| **Audit findings** | Open, overdue and closed findings with severity |
| **Policies** | Review cadence, next review date and attestation rate |

## Scoring rules

- **Risk score** = likelihood (1–5) × impact (1–5). Bands: 1–4 Low, 5–9 Medium, 10–14 High, 15–25 Critical.
- **Framework compliance** = the average over its controls, where implemented counts as 1, partial as 0.5 and not implemented as 0.
- **Finding overdue** = still open after its due date.
- **Policy overdue** = last review date + review cycle is earlier than the as-of date.

## Data

All sample data is in `data.js` (`window.GRC_SEED`). Replace it with your own records, or change `app.js` to fetch from an API.
Edits to the risk register are saved in the browser's `localStorage`. **Reset sample data** clears them.
Use the **Theme** button to switch between light and dark. It follows the OS setting until you choose one.
