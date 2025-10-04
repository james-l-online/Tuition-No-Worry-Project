-- Large development seed for Tuition No Worry
-- Generates: 80 parents, 12 teachers, 113 students, classes, lessons, exams, assignments, results, attendance, messages, announcements, events.
-- Run with: psql $DATABASE_URL -f sql/seed-large.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a junction to allow multiple parents per student (secondary parent links)
CREATE TABLE IF NOT EXISTS student_parent (
  student_id text NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  parent_id text NOT NULL REFERENCES parent(id) ON DELETE CASCADE,
  PRIMARY KEY (student_id, parent_id)
);

-- Grades
INSERT INTO grade (id, level) VALUES (1, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO grade (id, level) VALUES (2, 2) ON CONFLICT (id) DO NOTHING;
INSERT INTO grade (id, level) VALUES (3, 3) ON CONFLICT (id) DO NOTHING;
INSERT INTO grade (id, level) VALUES (4, 4) ON CONFLICT (id) DO NOTHING;

-- Create classes (3 classes per level -> 12 classes)
INSERT INTO class (id, name, capacity, grade_id) VALUES (1, 'Sec1A', 30, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO class (id, name, capacity, grade_id) VALUES (2, 'Sec1B', 30, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO class (id, name, capacity, grade_id) VALUES (3, 'Sec1C', 30, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO class (id, name, capacity, grade_id) VALUES (4, 'Sec2A', 30, 2) ON CONFLICT (id) DO NOTHING;
INSERT INTO class (id, name, capacity, grade_id) VALUES (5, 'Sec2B', 30, 2) ON CONFLICT (id) DO NOTHING;
INSERT INTO class (id, name, capacity, grade_id) VALUES (6, 'Sec2C', 30, 2) ON CONFLICT (id) DO NOTHING;
INSERT INTO class (id, name, capacity, grade_id) VALUES (7, 'Sec3A', 30, 3) ON CONFLICT (id) DO NOTHING;
INSERT INTO class (id, name, capacity, grade_id) VALUES (8, 'Sec3B', 30, 3) ON CONFLICT (id) DO NOTHING;
INSERT INTO class (id, name, capacity, grade_id) VALUES (9, 'Sec3C', 30, 3) ON CONFLICT (id) DO NOTHING;
INSERT INTO class (id, name, capacity, grade_id) VALUES (10, 'Sec4A', 30, 4) ON CONFLICT (id) DO NOTHING;
INSERT INTO class (id, name, capacity, grade_id) VALUES (11, 'Sec4B', 30, 4) ON CONFLICT (id) DO NOTHING;
INSERT INTO class (id, name, capacity, grade_id) VALUES (12, 'Sec4C', 30, 4) ON CONFLICT (id) DO NOTHING;

-- Admin
INSERT INTO admin (id, username) VALUES ('admin_1', 'admin') ON CONFLICT (username) DO NOTHING;

-- Teachers: mix of Asian-sounding and a few English names
DO $$
DECLARE
  teachers text[] := ARRAY[
    'Lim Wei', 'Tan Mei', 'Wong Jun', 'Chan Li', 'Ng Kai', 'Heng Siew', 'Kumar Raj', 'Siti Aishah', 'Liew Hao', 'Goh Siu', 'Amy Johnson', 'David Smith'
  ];
  i int := 1;
  tname text;
  uname text;
BEGIN
  FOREACH tname IN ARRAY teachers LOOP
    uname := 'teacher_' || i;
    INSERT INTO teacher (id, username, name, surname, blood_type, sex, address, birthday)
      VALUES (uname, uname, split_part(tname,' ',1), split_part(tname,' ',2), 'O+', 'MALE', 'Singapore', '1980-01-01')
      ON CONFLICT (username) DO NOTHING;
    i := i + 1;
    EXIT WHEN i > 12;
  END LOOP;
END$$;

-- Subjects
DO $$
DECLARE
  subs text[] := ARRAY['English','Mathematics','Science','Geography','History','Chinese','Malay','Tamil','Art','Physical Education'];
  s text;
BEGIN
  FOREACH s IN ARRAY subs LOOP
    INSERT INTO subject (name) VALUES (s) ON CONFLICT (name) DO NOTHING;
  END LOOP;
END$$;

-- Link teachers to subjects round-robin
DO $$
DECLARE
  t record;
  s record;
  tids text[] := ARRAY(SELECT id FROM teacher ORDER BY username LIMIT 12);
  sid int := 1;
  idx int := 1;
BEGIN
  FOR s IN SELECT id FROM subject ORDER BY id LOOP
    -- assign a teacher to each subject
    INSERT INTO subject_teacher (subject_id, teacher_id)
      VALUES (s.id, tids[(idx - 1) % array_length(tids,1) + 1]) ON CONFLICT DO NOTHING;
    idx := idx + 1;
  END LOOP;
END$$;

-- Parents (80). Use Singapore-style surnames/given names.
DO $$
DECLARE
  surnames text[] := ARRAY['Tan','Lim','Lee','Wong','Ng','Chan','Goh','Lai','Koh','Yap','Teo','Ho','Chong','Heng','Liu','Kumar','Sulaiman','Rahman','Nguyen','Pham'];
  given text[] := ARRAY['Wei','Mei','Jun','Li','Kai','Siew','Hao','Siu','Ling','Hui','Xiang','Jia','Yu','Wei','Zhi','An','Min','Hui','Cheng','Ling'];
  i int := 1;
  s text;
  g text;
  uname text;
  fname text;
BEGIN
  WHILE i <= 80 LOOP
    s := surnames[(i % array_length(surnames,1)) + 1];
    g := given[(i % array_length(given,1)) + 1];
    uname := 'parent_' || i;
    INSERT INTO parent (id, username, name, surname, phone, address)
      VALUES (uname, uname, g, s, ('+65' || lpad((10000000 + i)::text,8,'0')), 'Singapore')
      ON CONFLICT (username) DO NOTHING;
    i := i + 1;
  END LOOP;
END$$;

-- Students (113). Primary parent assignment: parents 1..33 get 2 students each (students 1..66).
-- parents 34..80 get 1 student each (students 67..113).
DO $$
DECLARE
  i int := 1;
  sid text;
  fname text;
  lname text;
  class_map int[] := ARRAY[1,2,3,4,5,6,7,8,9,10,11,12];
  class_idx int := 1;
  surname_list text[] := ARRAY['Tan','Lim','Lee','Wong','Ng','Chan','Goh','Lai','Koh','Yap','Teo','Ho'];
  given_list text[] := ARRAY['Wei','Hui','Xuan','Zhi','Tian','Xiao','Jia','Li','Ming','Yan','Qing','Jun','Siew','Hao','Ai','Mei'];
  pcount int;
  primary_parent text;
BEGIN
  -- students 1..66 -> parents 1..33 two each
  WHILE i <= 66 LOOP
    sid := 'student_' || i;
    fname := given_list[(i % array_length(given_list,1)) + 1];
    lname := surname_list[(i % array_length(surname_list,1)) + 1];
    primary_parent := 'parent_' || ceil(i::numeric/2)::text;
    INSERT INTO student (id, username, name, surname, address, blood_type, sex, parent_id, class_id, grade_id, birthday)
      VALUES (sid, sid, fname, lname, 'Singapore', 'A+', 'FEMALE', primary_parent, class_map[class_idx], CASE WHEN class_map[class_idx] <= 3 THEN 1 WHEN class_map[class_idx] <= 6 THEN 2 WHEN class_map[class_idx] <= 9 THEN 3 ELSE 4 END, '2009-01-01')
      ON CONFLICT (username) DO NOTHING;
    class_idx := (class_idx % array_length(class_map,1)) + 1;
    i := i + 1;
  END LOOP;

  -- students 67..113 -> parents 34..80 one each
  WHILE i <= 113 LOOP
    sid := 'student_' || i;
    fname := given_list[(i % array_length(given_list,1)) + 1];
    lname := surname_list[(i % array_length(surname_list,1)) + 1];
    primary_parent := 'parent_' || (33 + (i - 66))::text; -- maps 67->parent_34 ...
    INSERT INTO student (id, username, name, surname, address, blood_type, sex, parent_id, class_id, grade_id, birthday)
      VALUES (sid, sid, fname, lname, 'Singapore', 'B+', 'MALE', primary_parent, class_map[class_idx], CASE WHEN class_map[class_idx] <= 3 THEN 1 WHEN class_map[class_idx] <= 6 THEN 2 WHEN class_map[class_idx] <= 9 THEN 3 ELSE 4 END, '2008-01-01')
      ON CONFLICT (username) DO NOTHING;
    class_idx := (class_idx % array_length(class_map,1)) + 1;
    i := i + 1;
  END LOOP;
END$$;

-- Secondary parent links: assign a second parent for students 1..33 from parents 34..66 respectively
DO $$
DECLARE
  i int := 1;
  sid text;
  second_parent text;
BEGIN
  WHILE i <= 33 LOOP
    sid := 'student_' || i;
    second_parent := 'parent_' || (33 + i)::text; -- parent_34..parent_66
    -- avoid linking same parent twice
    INSERT INTO student_parent (student_id, parent_id)
      VALUES (sid, second_parent)
      ON CONFLICT DO NOTHING;
    i := i + 1;
  END LOOP;
END$$;

-- Create messages: some welcome messages from parent to admin
DO $$
DECLARE
  i int := 1;
BEGIN
  WHILE i <= 80 LOOP
    INSERT INTO message (sender_id, receiver_id, content)
      VALUES ('parent_'||i, 'parent_1', 'Hello, I have a question regarding my child.')
      ON CONFLICT DO NOTHING;
    i := i + 1;
  END LOOP;
END$$;

-- Create subjects already exist; create a few lessons per class (6 lessons per class)
DO $$
DECLARE
  cls record;
  sids int[] := ARRAY(SELECT id FROM subject ORDER BY id);
  tid text[] := ARRAY(SELECT id FROM teacher ORDER BY username);
  subj_count int := array_length(sids,1);
  tidx int := 1;
  sid_idx int := 1;
  day_vals text[] := ARRAY['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY'];
  lesson_name text;
  lcount int;
BEGIN
  FOR cls IN SELECT id FROM class LOOP
    lcount := 1;
    WHILE lcount <= 6 LOOP
      lesson_name := 'Lesson '||lcount||' for class '||cls.id;
      INSERT INTO lesson (name, day, start_time, end_time, subject_id, class_id, teacher_id)
        VALUES (lesson_name, day_vals[(lcount % 5) + 1]::day_enum, now() + (lcount || ' days')::interval, now() + ((lcount || ' days')::interval + '1 hour'::interval), sids[((lcount-1) % subj_count)+1], cls.id, tid[( (cls.id + lcount) % array_length(tid,1) ) + 1])
        ON CONFLICT DO NOTHING;
      lcount := lcount + 1;
    END LOOP;
  END LOOP;
END$$;

-- Exams and assignments: one exam and one assignment per lesson
DO $$
DECLARE
  les record;
BEGIN
  FOR les IN SELECT id FROM lesson LOOP
    INSERT INTO exam (title, start_time, end_time, lesson_id) VALUES ('Exam for lesson '||les.id, now()+ '7 days'::interval, now()+'8 days'::interval, les.id) ON CONFLICT DO NOTHING;
    INSERT INTO assignment (title, start_date, due_date, lesson_id) VALUES ('Assignment for lesson '||les.id, now(), now() + '14 days'::interval, les.id) ON CONFLICT DO NOTHING;
  END LOOP;
END$$;

-- Results: for each student, randomly assign results for a subset of exams/assignments
DO $$
DECLARE
  st record;
  ex record;
BEGIN
  FOR st IN SELECT id FROM student LOOP
    FOR ex IN SELECT id FROM exam ORDER BY id LIMIT 5 LOOP
      INSERT INTO result (score, exam_id, assignment_id, student_id) VALUES ((40 + (random()*60))::int, ex.id, NULL, st.id) ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END$$;

-- Attendance: for each student mark presence for some lessons
DO $$
DECLARE
  st record;
  les record;
BEGIN
  FOR st IN SELECT id FROM student LOOP
    FOR les IN SELECT id FROM lesson ORDER BY id LIMIT 10 LOOP
      INSERT INTO attendance (date, present, student_id, lesson_id) VALUES (now() - ((les.id % 30) || ' days')::interval, (random() > 0.1), st.id, les.id) ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END$$;

-- Announcements: one per class
DO $$
DECLARE
  cls record;
BEGIN
  FOR cls IN SELECT id FROM class LOOP
    INSERT INTO announcement (title, description, date, class_id) VALUES ('Welcome to ' || (SELECT name FROM class WHERE id = cls.id), 'General announcement for the class', now(), cls.id) ON CONFLICT DO NOTHING;
  END LOOP;
END$$;

-- Events: a few events per class
DO $$
DECLARE
  cls record;
  i int;
BEGIN
  FOR cls IN SELECT id FROM class LOOP
    i := 1;
    WHILE i <= 2 LOOP
      INSERT INTO event (title, description, start_time, end_time, class_id) VALUES ('Event '||i||' for '||(SELECT name FROM class WHERE id = cls.id), 'Event description', now() + (i || ' days')::interval, now() + ((i || ' days')::interval + '2 hours'::interval), cls.id) ON CONFLICT DO NOTHING;
      i := i + 1;
    END LOOP;
  END LOOP;
END$$;

-- Done
-- Output a friendly completion message so psql/node callers can see status
SELECT 'Large seed completed: parents 80, teachers 12, students 113 (primary parent set), lessons/exams/assignments/results/attendance/messages/announcements/events created.' AS info;
