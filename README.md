# Impact Vault

A yield-giving vault on Arc Testnet. Depositors lock USDC until maturity and get their full principal back. Only the yield earned in the meantime is donated, and it goes to causes approved by the vault admin.

Built with [Arc Studio](https://studio.arc.io)

## What it does

- Deposit USDC before the deposit deadline. Your principal is invested in a USDC yield strategy.
- At maturity anyone can settle the vault, and every depositor can withdraw their original deposit.
- The admin approves causes and sends the earned yield to them.
- If the admin does not distribute the yield within the grace period (at least 7 days), anyone can send what is left to the fallback cause chosen at deployment.
- In a testnet emergency, the admin can stop deposits and let depositors pull out early. If the strategy cannot pay out, depositors receive their share of the strategy position directly instead.
- Principal is returned in full as long as the yield strategy returns at least the total deposited. If the strategy loses money, depositors share the loss proportionally.

A demo yield strategy is included for testnet use only. It is unaudited and must not hold real funds.

## Donor app (demo)

A responsive web app for donors, running on synthetic data. It is not connected to a real wallet or to the deployed contracts yet.

- Public pages: home, onboarding, and an impact explorer with two pools (Hunger Relief and Kalimantan Forest Fire Relief).
- Wallet pages: dashboard, deposit, activity, withdraw and account.
- Principal and sponsor-funded demo proceeds are always shown separately.
- A "Demo controls" button in the top banner lets you reach every state: missing wallet, wrong network, insufficient fees, rejected signature, pending, unknown status and confirmed.

## Tech stack

React, Vite, TypeScript, Tailwind CSS, React Router. Solidity, Foundry and OpenZeppelin Contracts for the vault. Target network: Arc Testnet (USDC).

## Development

Prerequisites: [Foundry](https://book.getfoundry.sh) and [Bun](https://bun.sh).

Install dependencies:

    bun install

Run the app:

    bun run dev

Check types and lint:

    bun run check

Build the contracts:

    forge build

Environment variables: None.
