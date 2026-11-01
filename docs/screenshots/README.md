# Screenshots

The root `README.md` references three images from this folder. Drop them in with these exact names:

| File | Page | What to capture |
| --- | --- | --- |
| `home.png` | `/` | Hero with the live phase chip, "The vault right now" balances, and the causes grid. Full-page, wallet disconnected. |
| `dashboard.png` | `/dashboard` | Wallet connected with a deposit present, so principal, the vault timeline and recent activity are all populated. |
| `impact.png` | `/impact` | The impact explorer with at least one approved cause. |

Capture at a 1440px-wide viewport (2x DPR if you can) for `home.png`, and the same width for the two side-by-side shots.

```bash
bun run dev   # then capture http://localhost:5173
```

Set `VITE_CAUSES` before capturing so causes show real names rather than raw addresses:

```bash
VITE_CAUSES='[{"address":"0x922De363B0eB317bE610f4FC707eF994A011EDE3","name":"Hunger Relief","purpose":"Emergency food distribution"}]' bun run dev
```
