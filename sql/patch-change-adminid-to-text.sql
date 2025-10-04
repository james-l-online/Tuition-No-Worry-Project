-- Patch to convert admin.id from uuid to text
BEGIN;
ALTER TABLE admin DROP CONSTRAINT IF EXISTS admin_pkey;
ALTER TABLE admin ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE admin ADD CONSTRAINT admin_pkey PRIMARY KEY (id);
COMMIT;
