-- Safer patch to convert UUID columns to text for Clerk user ids
-- Drops FK constraints that reference teacher/parent/student ids, alters types, then recreates simple FKs.
-- Make sure to backup your DB before running this in production.

BEGIN;

-- Drop foreign key constraints that reference teacher.id, parent.id, or student.id
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tc.constraint_name, tc.table_schema, tc.table_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name AND tc.constraint_schema = ccu.constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND (
      (ccu.table_name = 'teacher' AND ccu.column_name = 'id') OR
      (ccu.table_name = 'parent' AND ccu.column_name = 'id') OR
      (ccu.table_name = 'student' AND ccu.column_name = 'id')
    )
  LOOP
    RAISE NOTICE 'Dropping constraint % on table %.%', r.constraint_name, r.table_schema, r.table_name;
    EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I', r.table_schema, r.table_name, r.constraint_name);
  END LOOP;
END$$;

-- Alter primary id columns to text
ALTER TABLE teacher ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE parent ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE student ALTER COLUMN id TYPE text USING id::text;

-- Alter dependent columns to text
ALTER TABLE lesson ALTER COLUMN teacher_id TYPE text USING teacher_id::text;
ALTER TABLE student ALTER COLUMN parent_id TYPE text USING parent_id::text;
ALTER TABLE result ALTER COLUMN student_id TYPE text USING student_id::text;
ALTER TABLE attendance ALTER COLUMN student_id TYPE text USING student_id::text;
ALTER TABLE message ALTER COLUMN sender_id TYPE text USING sender_id::text;
ALTER TABLE message ALTER COLUMN receiver_id TYPE text USING receiver_id::text;
ALTER TABLE subject_teacher ALTER COLUMN teacher_id TYPE text USING teacher_id::text;

-- Recreate basic foreign key constraints (names chosen to match common convention)
ALTER TABLE lesson ADD CONSTRAINT lesson_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES teacher(id);
ALTER TABLE student ADD CONSTRAINT student_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES parent(id);
ALTER TABLE result ADD CONSTRAINT result_student_id_fkey FOREIGN KEY (student_id) REFERENCES student(id);
ALTER TABLE attendance ADD CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES student(id);
ALTER TABLE message ADD CONSTRAINT message_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES parent(id);
ALTER TABLE message ADD CONSTRAINT message_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES parent(id);
ALTER TABLE subject_teacher ADD CONSTRAINT subject_teacher_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES teacher(id);

COMMIT;
