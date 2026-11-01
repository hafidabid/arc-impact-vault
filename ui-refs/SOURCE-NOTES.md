# Source notes and decision status

## Source reviewed

Referenced ChatGPT conversation: “Branch · Arc overview”, ID `6ae57f94-3cc4-83ec-86bd-92e2aaed8c72`. The available thread was read on 31 October 2026. It exposes five user turns and assistant reference placeholders; the assistant bodies and any earlier detailed designs are unavailable. There were no readable attachments or older-page cursor.

## Confirmed requirements

- Calm Wealth + Transparent Impact visual identity; responsive web application with mobile-first UX.
- Visual system, onboarding, homepage and dashboard.
- Admin panel and inflow/outflow tracking for vault and impact/charity contracts.
- Exactly two donation pools: Hunger Relief and Kalimantan Forest Fire Relief.
- A 3 USDC deposit example, eligible-proceeds attribution, and routing without spending principal.
- The current request specifies all included pages, exact palette, separate 0.20 USDC sponsor-funded demo donation proceeds, and prohibited claims.

## Proposed implementation details

Typography, breakpoints, component sizing, route names, reviewer workflow, data model, journal accounts, role separation, demo eligibility event, and acceptance tests in this package are proposed specifications. They are not recovered quotations or confirmed decisions from missing assistant replies.

The demo assumes a fully funded 0.20 USDC sponsor lot explicitly assigned to the example deposit after its 3 USDC deposit confirms. It does not derive this amount from deposit size, time, APY, or a yield strategy. Production eligibility policy, custody, supported chain, contract addresses, recipient due diligence, fee funding and settlement finality remain to be decided.
