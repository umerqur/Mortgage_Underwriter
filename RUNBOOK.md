# Intake System — Deployment Runbook

This document covers how to apply the intake database schema, storage bucket,
RLS policies, and edge function to your Supabase project.

Nothing in this repo is auto-applied. You must run every step below manually.

---

## Prerequisites

| Tool | Purpose |
|------|---------|
| Supabase CLI (`supabase`) | Migrations and edge-function deploy |
| `psql` or Supabase SQL Editor | Running SQL directly |
| Supabase Dashboard | Bucket creation fallback, visual verification |

Make sure you are logged in:

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

---

## 1. Apply Migrations

Migration files live in `supabase/migrations/`. Apply them in order.

### Option A — Supabase CLI

```bash
supabase db push
```

This runs all files in `supabase/migrations/` that have not yet been applied.

### Option B — SQL Editor (manual)

Open each file in the Supabase Dashboard SQL Editor and run them in order:

1. `20260131000001_create_intakes.sql`
2. `20260131000002_create_intake_uploads.sql`
3. `20260131000003_create_extracted_fields.sql`
4. `20260131000004_create_storage_bucket.sql`

### Option C — psql

```bash
psql "$DATABASE_URL" -f supabase/migrations/20260131000001_create_intakes.sql
psql "$DATABASE_URL" -f supabase/migrations/20260131000002_create_intake_uploads.sql
psql "$DATABASE_URL" -f supabase/migrations/20260131000003_create_extracted_fields.sql
psql "$DATABASE_URL" -f supabase/migrations/20260131000004_create_storage_bucket.sql
```

---

## 2. Create Storage Bucket (if SQL insert failed)

Migration 4 attempts to insert the bucket via SQL. If that fails (some
Supabase projects restrict `INSERT INTO storage.buckets` from user SQL),
create the bucket manually:

1. Go to **Supabase Dashboard → Storage**
2. Click **New Bucket**
3. Settings:
   - **Name:** `brokerops_uploads`
   - **Public:** OFF (private)
   - **File size limit:** 50 MB (`52428800` bytes)
   - **Allowed MIME types:** `application/pdf`, `image/png`, `image/jpeg`, `image/webp`, `image/tiff`
4. Click **Create**

Then run **only the policy statements** from migration 4 in the SQL Editor
(skip the `INSERT INTO storage.buckets` block).

---

## 3. Deploy Edge Function

```bash
supabase functions deploy intake-signed-url --no-verify-jwt
```

`--no-verify-jwt` is used because the function handles its own JWT
verification internally (it needs the raw token to identify the user).

### Required Secrets

The function reads these from the Supabase Edge Functions runtime:

| Variable | Provided by | Notes |
|----------|-------------|-------|
| `SUPABASE_URL` | Automatic | Set by Supabase runtime |
| `SUPABASE_ANON_KEY` | Automatic | Set by Supabase runtime |
| `SUPABASE_SERVICE_ROLE_KEY` | Automatic | Set by Supabase runtime |

No manual secrets need to be configured — Supabase injects these into every
edge function automatically.

---

## 4. Verify Tables Exist

Run in the SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('intakes', 'intake_uploads', 'extracted_fields')
ORDER BY table_name;
```

Expected result: three rows.

---

## 5. Verify RLS Is Enabled

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('intakes', 'intake_uploads', 'extracted_fields');
```

All three rows should show `rowsecurity = true`.

---

## 6. Verify RLS Policies

```sql
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('intakes', 'intake_uploads', 'extracted_fields')
ORDER BY tablename, cmd;
```

Expected: 4 policies per table (SELECT, INSERT, UPDATE, DELETE), 12 total.

---

## 7. Verify Storage Bucket

```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'brokerops_uploads';
```

Expected: one row with `public = false`.

---

## 8. Verify Storage Policies

```sql
SELECT name, action
FROM storage.policies
WHERE bucket_id = 'brokerops_uploads'
ORDER BY action;
```

If the above view does not exist on your Supabase version, use:

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'Intake owner%'
ORDER BY cmd;
```

Expected: 3 policies (INSERT, SELECT, DELETE).

---

## 9. Verify Indexes

```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_intakes_created_by',
    'idx_intake_uploads_intake_id',
    'idx_extracted_fields_intake_id',
    'idx_extracted_fields_source_upload_id'
  )
ORDER BY tablename;
```

Expected: 4 rows.

---

## 10. End-to-End Smoke Test

Run these in the SQL Editor while authenticated as a test user, or use
`psql` with `SET request.jwt.claims = '...'` to simulate a user context.

### 10a. Insert a test intake

```sql
-- Replace <your-user-uuid> with your auth.uid()
INSERT INTO intakes (created_by_user_id, broker_name, client_first_name,
  client_last_name, client_email, client_phone, form_answers, engine_tags,
  required_docs)
VALUES (
  '<your-user-uuid>',
  'Test Broker',
  'Jane',
  'Doe',
  'jane@example.com',
  '555-0100',
  '{"transactionType":"purchase_resale"}'::jsonb,
  ARRAY['purchase','resale'],
  '[{"id":"doc_aps","name":"Agreement of Purchase and Sale"}]'::jsonb
)
RETURNING id;
```

### 10b. Insert a test upload

```sql
-- Replace <intake-id> with the id returned above
INSERT INTO intake_uploads (intake_id, file_path, file_name, mime_type, size_bytes)
VALUES (
  '<intake-id>',
  'intakes/<intake-id>/00000000-0000-0000-0000-000000000001/test.pdf',
  'test.pdf',
  'application/pdf',
  1024
)
RETURNING id;
```

### 10c. Insert a test extracted field

```sql
-- Replace <intake-id> and <upload-id> with the ids above
INSERT INTO extracted_fields (intake_id, source_upload_id, field_key,
  field_label, field_value, field_type, confidence)
VALUES (
  '<intake-id>',
  '<upload-id>',
  'purchase_price',
  'Purchase Price',
  '500000',
  'currency',
  0.95
)
RETURNING id;
```

### 10d. Verify ownership isolation

From a *different* user context (or via service role with a different uid),
confirm these queries return zero rows:

```sql
-- Should return 0 rows for a different user
SELECT * FROM intakes WHERE id = '<intake-id>';
SELECT * FROM intake_uploads WHERE intake_id = '<intake-id>';
SELECT * FROM extracted_fields WHERE intake_id = '<intake-id>';
```

### 10e. Test the edge function

```bash
curl -X POST \
  'https://<your-project-ref>.supabase.co/functions/v1/intake-signed-url' \
  -H 'Authorization: Bearer <user-jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"intake_id":"<intake-id>","file_path":"intakes/<intake-id>/<upload-id>/test.pdf"}'
```

Expected: `200` with `{ "signed_url": "...", "expires_in": 600 }`.

With a wrong intake_id or another user's JWT, expect `403` or `404`.

### 10f. Cleanup

```sql
DELETE FROM intakes WHERE broker_name = 'Test Broker';
```

Cascade deletes will remove the related uploads and extracted fields.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `relation "intakes" does not exist` | Migrations not applied | Run migrations (Section 1) |
| `bucket not found` on upload | Bucket SQL insert failed silently | Create bucket via Dashboard (Section 2) |
| `new row violates RLS policy` on insert | `auth.uid()` does not match `created_by_user_id` | Ensure the JWT user matches the owner field |
| Edge function returns 401 | Missing or expired JWT | Pass a valid `Authorization: Bearer <token>` header |
| Edge function returns 500 | Service role key not injected | Verify the function is deployed to the linked project |
