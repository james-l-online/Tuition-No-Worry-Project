-- Patch to convert UUID columns to text for Clerk user ids
-- Make sure to backup your DB before running this in production.

BEGIN;

-- teacher.id
ALTER TABLE teacher ALTER COLUMN id TYPE text USING id::text;
-- parent.id
ALTER TABLE parent ALTER COLUMN id TYPE text USING id::text;
-- student.id
ALTER TABLE student ALTER COLUMN id TYPE text USING id::text;
-- lesson.teacher_id
ALTER TABLE lesson ALTER COLUMN teacher_id TYPE text USING teacher_id::text;
-- student.parent_id
ALTER TABLE student ALTER COLUMN parent_id TYPE text USING parent_id::text;
-- result.student_id
ALTER TABLE result ALTER COLUMN student_id TYPE text USING student_id::text;
-- attendance.student_id
ALTER TABLE attendance ALTER COLUMN student_id TYPE text USING student_id::text;
-- message sender/receiver
ALTER TABLE message ALTER COLUMN sender_id TYPE text USING sender_id::text;
ALTER TABLE message ALTER COLUMN receiver_id TYPE text USING receiver_id::text;
-- junction subject_teacher.teacher_id
ALTER TABLE subject_teacher ALTER COLUMN teacher_id TYPE text USING teacher_id::text;

COMMIT;
