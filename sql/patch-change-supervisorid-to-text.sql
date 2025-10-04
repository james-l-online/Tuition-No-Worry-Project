-- Patch to convert class.supervisor_id (uuid) to text to match teacher.id
BEGIN;

ALTER TABLE class DROP CONSTRAINT IF EXISTS class_supervisor_id_fkey;
ALTER TABLE class ALTER COLUMN supervisor_id TYPE text USING supervisor_id::text;
ALTER TABLE class ADD CONSTRAINT class_supervisor_id_fkey FOREIGN KEY (supervisor_id) REFERENCES teacher(id);

COMMIT;
