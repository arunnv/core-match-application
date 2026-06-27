# CoreMatch — Production Deployment Runbook

> Target: Bluehost unmanaged VPS · Coolify single-node · Docker Compose  
> Stack: Next.js 16 (standalone) · PostgreSQL 16 + pgvector · Drizzle ORM

---

## 1 · Repository Setup in Coolify

### 1.1 Connect your Git source
1. **Coolify sidebar → Sources → + Add**.
2. Choose **GitHub** (or GitLab / Gitea). Follow the OAuth flow to install the Coolify GitHub App on your repository.
3. Once connected, go to **Projects → + New Project → New Resource → Docker Compose**.
4. Select your repository and branch (`main`). Coolify will detect `docker-compose.yml` automatically.

### 1.2 Set the Docker Compose file path
In resource settings, confirm the compose file path is `docker-compose.yml` (root level).

---

## 2 · Environment Variables

Add every variable below in **Coolify → Resource → Environment Variables**.  
Never commit `.env` files — all secrets live exclusively in Coolify.

| Variable | Example value | Notes |
|---|---|---|
| `POSTGRES_DB` | `corematch` | DB name inside the container |
| `POSTGRES_USER` | `corematch` | DB user |
| `POSTGRES_PASSWORD` | `<strong-random>` | **Required.** Min 24 chars |
| `NEXTAUTH_URL` | `https://app.yourdomain.com` | Must match your public domain exactly |
| `NEXTAUTH_SECRET` | `<output of: openssl rand -base64 32>` | JWT signing key |
| `GEMINI_API_KEY` | `AIza...` | Google AI Studio key |
| `GOOGLE_CLIENT_ID` | `....apps.googleusercontent.com` | OAuth (optional) |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | OAuth (optional) |

> `DATABASE_URL` is assembled **automatically** inside `docker-compose.yml` from the three `POSTGRES_*` vars — do **not** add it separately in Coolify.

---

## 3 · Domain & SSL Configuration

### Apex domain (`yourdomain.com`) → marketing / landing
1. In your DNS registrar, add:
   ```
   A    @      <VPS-IP>
   A    www    <VPS-IP>
   ```
2. Coolify → Resource for any static/landing service → **Domains** → enter `yourdomain.com, www.yourdomain.com`.
3. Enable **Force HTTPS** and **Let's Encrypt** (Coolify handles cert issuance automatically via Traefik).

### App subdomain (`app.yourdomain.com`) → Next.js app
1. DNS:
   ```
   A    app    <VPS-IP>
   ```
2. Coolify → CoreMatch resource → **Domains** → enter `app.yourdomain.com`.
3. Make sure `NEXTAUTH_URL=https://app.yourdomain.com` matches.
4. Enable **Force HTTPS** — Coolify/Traefik will provision the cert.

> Coolify exposes port `3000` internally. **Remove the `ports:` mapping from docker-compose.yml in production** and let Traefik route via the internal Docker network label — this prevents direct port exposure.

---

## 4 · Database Migrations

### Running migrations after first deploy (or after schema changes)

Migrations are **never run automatically** on startup. Run them explicitly:

#### Option A — From your local machine (recommended for controlled deploys)
```bash
# Point at the production DB via an SSH tunnel
ssh -L 5432:localhost:5432 root@<VPS-IP> \
  "docker exec -it corematch_postgres \
   psql -U corematch -d corematch -c 'SELECT 1'"

# In a separate terminal, with the tunnel open:
DATABASE_URL=postgresql://corematch:<password>@localhost:5432/corematch \
  npx drizzle-kit migrate
```

#### Option B — Exec into the running app container on the VPS
```bash
# SSH into your VPS
ssh root@<VPS-IP>

# Run migrations inside the app container (drizzle-kit is installed in the image)
docker exec -it corematch_app \
  sh -c "DATABASE_URL=\$DATABASE_URL npx drizzle-kit migrate"
```

#### Option C — One-shot migration container (cleanest for CI)
Add this to your deployment pipeline or run manually:
```bash
docker run --rm \
  --network corematch_corematch_net \
  -e DATABASE_URL="postgresql://corematch:<password>@postgres:5432/corematch" \
  corematch_app \
  sh -c "npx drizzle-kit migrate"
```

### Generating a new migration after schema changes
```bash
# Locally, after editing db/schema.ts
npx drizzle-kit generate

# Commit the new file in db/migrations/
git add db/migrations/ && git commit -m "chore: add migration XXXX"
git push
# Coolify rebuilds the image; then run Option A or B above
```

---

## 5 · Automated Backups via Cloudflare R2

### 5.1 Create an R2 bucket
1. Cloudflare dashboard → **R2 → Create bucket** → name it `corematch-backups`.
2. **Manage R2 API tokens → Create token** with `Object Read & Write` on that bucket.
3. Note: `Access Key ID`, `Secret Access Key`, `Account ID`.
4. S3-compatible endpoint: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

### 5.2 Configure backups in Coolify
1. Coolify sidebar → **Backups → + Add Backup**.
2. Select **S3-compatible**.
3. Fill in:
   | Field | Value |
   |---|---|
   | Endpoint | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
   | Bucket | `corematch-backups` |
   | Region | `auto` |
   | Access Key | your R2 Access Key ID |
   | Secret Key | your R2 Secret Access Key |
4. Under **Resources**, select the `corematch_postgres` service.
5. Set schedule (e.g., `0 3 * * *` = 3 AM daily).
6. **Save & Test** — Coolify will run `pg_dump` and upload a `.sql.gz` to R2.

### 5.3 Manual backup (on-demand)
```bash
# SSH into VPS, then:
docker exec corematch_postgres \
  pg_dump -U corematch -d corematch \
  | gzip > /tmp/corematch_$(date +%Y%m%d_%H%M%S).sql.gz

# Upload to R2 via rclone or aws-cli configured for R2
aws s3 cp /tmp/corematch_*.sql.gz \
  s3://corematch-backups/ \
  --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

### 5.4 Restore from backup
```bash
# Download from R2
aws s3 cp s3://corematch-backups/corematch_20240101_030000.sql.gz . \
  --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com

# Restore
gunzip -c corematch_20240101_030000.sql.gz \
  | docker exec -i corematch_postgres \
    psql -U corematch -d corematch
```

---

## 6 · Zero-Downtime Git Webhook Deploys

Coolify handles this automatically once connected to Git:
1. Every push to `main` triggers Coolify's webhook.
2. Coolify builds the new Docker image.
3. It starts the new container, waits for the `/api/health` healthcheck to return `200`.
4. Only then does Traefik cut traffic to the new container — old one is stopped.

> Because PostgreSQL runs as a separate service with a persistent volume, DB state is **never touched** during app redeployments.

---

## 7 · Health Check Reference

| URL | Auth required | Expected response |
|---|---|---|
| `GET /api/health` | No | `200 {"status":"ok","db":"reachable",...}` |
| `GET /api/health` (DB down) | No | `503 {"status":"unhealthy","db":"unreachable",...}` |

Coolify and Traefik both poll this endpoint. A `503` response pulls the container out of rotation automatically.

---

## 8 · Quick Troubleshooting

| Symptom | First check |
|---|---|
| App container restart-looping | `docker logs corematch_app --tail 50` — usually a missing env var |
| `DATABASE_URL is not set` error | Verify all `POSTGRES_*` vars are set in Coolify |
| Migrations fail | Confirm `postgres` container is healthy first: `docker ps` |
| OAuth redirect mismatch | `NEXTAUTH_URL` must exactly match the domain in Google Cloud Console |
| 502 from Traefik | App healthcheck failing — check `/api/health` directly on the VPS: `curl localhost:3000/api/health` |
