# Working on Wrenfield Orders

- Money is integer cents everywhere. Never use floating-point amounts; split an amount with `allocate` in `src/money.ts`.
- Every bug fix comes with a test that fails before the fix.
- The business rules in `README.md` and the code change together: if a rule changes, update both in the same pull request.
- Run `npm test` and `npm run typecheck` before you push. CI runs both on every pull request.
