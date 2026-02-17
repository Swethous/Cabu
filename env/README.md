# Env Management

Create local env files from templates:

```bash
cp env/.env.shared.example env/.env.shared
cp env/.env.backend.example env/.env.backend
cp env/.env.frontend.example env/.env.frontend
```

Run docker compose from repository root:

```bash
docker compose -f infra/docker/compose.yml up --build
```

Notes:
- `env/.env*` files are ignored by git.
- Keep real secrets only in local env files.
- Backend uses `env/.env.shared` + `env/.env.backend`.
- Frontend uses `env/.env.shared` + `env/.env.frontend`.
