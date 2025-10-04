-- Minimal seed data for development/testing
-- Run with: psql $DATABASE_URL -f sql/seed.sql

-- Ensure extensions for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO grade (level) VALUES (1) ON CONFLICT DO NOTHING;
INSERT INTO grade (level) VALUES (2) ON CONFLICT DO NOTHING;

-- Create a class for grade 1
INSERT INTO class (name, capacity, grade_id) VALUES ('Class A', 30, 1)
  ON CONFLICT (name) DO NOTHING;

-- Create an admin user
INSERT INTO admin (username) VALUES ('admin') ON CONFLICT (username) DO NOTHING;

-- Parent
INSERT INTO parent (username, name, surname, phone, address) VALUES ('parent1','Parent','One','+1000000000','Addr 1')
  ON CONFLICT (username) DO NOTHING;

-- Teacher
INSERT INTO teacher (username,name,surname,blood_type,sex,address,birthday) VALUES
  ('teacher1','Teach','One','O+','MALE','Addr T','2000-01-01') ON CONFLICT (username) DO NOTHING;

-- Subject
INSERT INTO subject (name) VALUES ('Mathematics') ON CONFLICT (name) DO NOTHING;

-- Link teacher to subject
DO $$
DECLARE
  t uuid;
  s int;
BEGIN
  SELECT id INTO t FROM teacher WHERE username='teacher1';
  SELECT id INTO s FROM subject WHERE name='Mathematics';
  IF t IS NOT NULL AND s IS NOT NULL THEN
    INSERT INTO subject_teacher (subject_id, teacher_id) VALUES (s, t) ON CONFLICT DO NOTHING;
  END IF;
END$$;

-- Student
DO $$
DECLARE
  p uuid;
  c int;
  g int;
BEGIN
  SELECT id INTO p FROM parent WHERE username='parent1';
  SELECT id INTO c FROM class WHERE name='Class A';
  SELECT id INTO g FROM grade WHERE level=1;
  IF p IS NOT NULL AND c IS NOT NULL AND g IS NOT NULL THEN
    INSERT INTO student (username,name,surname,address,blood_type,sex,parent_id,class_id,grade_id,birthday)
      VALUES ('student1','Stud','One','Addr S','A+','FEMALE',p,c,g,'2010-05-05') ON CONFLICT (username) DO NOTHING;
  END IF;
END$$;

-- Messages
DO $$
DECLARE
  p uuid;
BEGIN
  SELECT id INTO p FROM parent WHERE username='parent1';
  IF p IS NOT NULL THEN
    INSERT INTO message (sender_id, receiver_id, content) VALUES (p, p, 'Welcome to Tuition No Worry!') ON CONFLICT DO NOTHING;
  END IF;
END$$;
