# Bill-ihin in the NovaMart workspace

Bill-ihin uses the existing React/Vite frontend and Express/MySQL backend layout. The generated AI Studio pages are under `frontend/src/pages`, their shared components are under `frontend/src/components`, and the existing Express server now serves the Bill-ihin API alongside the retained NovaMart product routes.

## Local setup

1. Create a MySQL database, for example:

   ```sql
   CREATE DATABASE bill_ihin CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
   ```

2. Copy `backend/.env.example` to `backend/.env`. Set the MySQL connection values and replace `JWT_SECRET` with a random secret at least 32 characters long.
3. From `backend`, run `npm run migrate`, then `npm start`.
4. Copy `frontend/.env.example` to `frontend/.env.local`. Change `VITE_API_URL` only if the backend is not at `http://localhost:5000/api`.
5. From `frontend`, run `npm run dev` and open the Vite URL.

The database starts empty. Registering creates the first household administrator; its invite code is available in household settings. Members can register with that code. An administrator can also create a member account and set its initial password.

## Data behavior

- Contributions are submitted as pending records. Only administrator confirmation counts toward confirmed household funds.
- Confirmed contributions remain separate from provider payments. Bill balances and paid status use provider payment records only.
- Confirmed/rejected contributions and provider payment records are retained in the financial history. Bills with financial records cannot be deleted.
- All household records are scoped on the API. Administrator-only writes are checked on the server as well as in the frontend.

## Checks

From `backend`, run `npm test` for input validation tests. From `frontend`, run `node --test src/utils/finance.test.js`, `npm run build`, and `npm run lint`.
