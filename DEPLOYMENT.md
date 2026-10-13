# CPS Hub V2 — deployment and data safety

## Current delivery

The current web interface is a visual preview using fictitious demonstration records. It is not yet a production system and must not be used to record live sales or inventory.

## Deployment

The GitHub Pages workflow is configured in `.github/workflows/pages.yml`. Before sharing a public app URL, confirm the Actions workflow completes successfully and the deployed page loads.

## Data isolation

- No production database is connected to the demo interface.
- Do not place Supabase service-role keys or other secrets in client-side code.
- Create and validate a separate test environment before connecting real data.
- Validate totals, inventory movements, permissions, backups, and restore procedures before commercial use.

## Next steps

1. Get the static build and GitHub Pages deployment green.
2. Verify the deployed dashboard on desktop and mobile.
3. Complete and test each module with fictitious data.
4. Add authentication and role-based access in a separate test backend.
5. Import a validated copy of real data only after reconciliation and approval.
