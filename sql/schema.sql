-- SQL schema derived from prisma/schema.prisma
-- Run with: psql $DATABASE_URL -f sql/schema.sql

-- enums
CREATE TYPE user_sex AS ENUM ('MALE', 'FEMALE');
CREATE TYPE day_enum AS ENUM ('MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY');

-- admin
CREATE TABLE IF NOT EXISTS admin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL
);

-- grade
CREATE TABLE IF NOT EXISTS grade (
  id serial PRIMARY KEY,
  level int UNIQUE NOT NULL
);

-- class
CREATE TABLE IF NOT EXISTS class (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  capacity int NOT NULL,
  supervisor_id uuid NULL,
  grade_id int NOT NULL REFERENCES grade(id) ON DELETE CASCADE
);

-- teacher
CREATE TABLE IF NOT EXISTS teacher (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  name text NOT NULL,
  surname text NOT NULL,
  email text UNIQUE,
  phone text UNIQUE,
  address text NOT NULL,
  img text,
  blood_type text NOT NULL,
  sex user_sex NOT NULL,
  created_at timestamptz DEFAULT now(),
  birthday timestamptz NOT NULL
);

-- parent
CREATE TABLE IF NOT EXISTS parent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  name text NOT NULL,
  surname text NOT NULL,
  email text UNIQUE,
  phone text UNIQUE NOT NULL,
  address text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- subject
CREATE TABLE IF NOT EXISTS subject (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL
);

-- lesson
CREATE TABLE IF NOT EXISTS lesson (
  id serial PRIMARY KEY,
  name text NOT NULL,
  day day_enum NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  subject_id int NOT NULL REFERENCES subject(id) ON DELETE CASCADE,
  class_id int NOT NULL REFERENCES class(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES teacher(id) ON DELETE CASCADE
);

-- exam
CREATE TABLE IF NOT EXISTS exam (
  id serial PRIMARY KEY,
  title text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  lesson_id int NOT NULL REFERENCES lesson(id) ON DELETE CASCADE
);

-- assignment
CREATE TABLE IF NOT EXISTS assignment (
  id serial PRIMARY KEY,
  title text NOT NULL,
  start_date timestamptz NOT NULL,
  due_date timestamptz NOT NULL,
  lesson_id int NOT NULL REFERENCES lesson(id) ON DELETE CASCADE
);

-- student
CREATE TABLE IF NOT EXISTS student (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  name text NOT NULL,
  surname text NOT NULL,
  email text UNIQUE,
  phone text UNIQUE,
  address text NOT NULL,
  img text,
  blood_type text NOT NULL,
  sex user_sex NOT NULL,
  created_at timestamptz DEFAULT now(),
  parent_id uuid NOT NULL REFERENCES parent(id) ON DELETE CASCADE,
  class_id int NOT NULL REFERENCES class(id) ON DELETE CASCADE,
  grade_id int NOT NULL REFERENCES grade(id) ON DELETE CASCADE,
  birthday timestamptz NOT NULL
);

-- result
CREATE TABLE IF NOT EXISTS result (
  id serial PRIMARY KEY,
  score int NOT NULL,
  exam_id int NULL REFERENCES exam(id) ON DELETE SET NULL,
  assignment_id int NULL REFERENCES assignment(id) ON DELETE SET NULL,
  student_id uuid NOT NULL REFERENCES student(id) ON DELETE CASCADE
);

-- attendance
CREATE TABLE IF NOT EXISTS attendance (
  id serial PRIMARY KEY,
  date timestamptz NOT NULL,
  present boolean NOT NULL,
  student_id uuid NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  lesson_id int NOT NULL REFERENCES lesson(id) ON DELETE CASCADE
);

-- event
CREATE TABLE IF NOT EXISTS event (
  id serial PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  class_id int NULL REFERENCES class(id) ON DELETE SET NULL
);

-- announcement
CREATE TABLE IF NOT EXISTS announcement (
  id serial PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  date timestamptz NOT NULL,
  class_id int NULL REFERENCES class(id) ON DELETE SET NULL
);

-- message
CREATE TABLE IF NOT EXISTS message (
  id serial PRIMARY KEY,
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_sender FOREIGN KEY (sender_id) REFERENCES parent(id) ON DELETE CASCADE
);

-- junction table: subject_teacher
CREATE TABLE IF NOT EXISTS subject_teacher (
  subject_id int NOT NULL REFERENCES subject(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES teacher(id) ON DELETE CASCADE,
  PRIMARY KEY (subject_id, teacher_id)
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_student_parent_id ON student(parent_id);
CREATE INDEX IF NOT EXISTS idx_student_class_id ON student(class_id);
CREATE INDEX IF NOT EXISTS idx_student_grade_id ON student(grade_id);
