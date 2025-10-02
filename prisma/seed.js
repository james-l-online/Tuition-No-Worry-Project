const { PrismaClient, Day, UserSex } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

const phoneWithLeading = (leading) => `${leading}${faker.string.numeric(8)}`;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const unique = (gen, count) => {
  const s = new Set();
  while (s.size < count) s.add(gen());
  return Array.from(s);
};
const DAYS = [Day.MONDAY, Day.TUESDAY, Day.WEDNESDAY, Day.THURSDAY, Day.FRIDAY];

async function main() {
  const subjectNames = unique(() => (faker.word.noun({ length: { min: 5, max: 12 } })
    .replace(/[^a-z]/gi, "")
    .slice(0, 1).toUpperCase() + faker.word.noun().slice(1)), 20);
  const subjects = [];
  for (const name of subjectNames) {
    const subject = await prisma.subject.upsert({ where: { name }, update: {}, create: { name } });
    subjects.push(subject);
  }

  // Create 50 grade levels
  const grades = [];
  for (let level = 1; level <= 50; level++) {
    const grade = await prisma.grade.upsert({ where: { level }, update: {}, create: { level } });
    grades.push(grade);
  }

  for (let i=0;i<8;i++){
    const username = `admin_${faker.string.alphanumeric({ length: 10 })}`.toLowerCase();
    await prisma.admin.upsert({ where: { username }, update: {}, create: { username } });
  }

  const parentPhones = unique(() => phoneWithLeading('9'), 80);
  const parents = [];
  for (let i=0;i<80;i++){
    const first = faker.person.firstName();
    const last = faker.person.lastName();
    const username = `${first}.${last}.${faker.string.alphanumeric({ length: 4 })}`.toLowerCase();
    const email = faker.internet.email({ firstName: first, lastName: last }).toLowerCase();
    const parent = await prisma.parent.upsert({ where: { username }, update: {}, create: {
      username, name: first, surname: last, email, phone: parentPhones[i], address: faker.location.streetAddress()
    }});
    parents.push(parent);
  }

  const teachers = [];
  for (let i=0;i<12;i++){
    const first = faker.person.firstName();
    const last = faker.person.lastName();
    const username = `${first}.${last}.${faker.string.alphanumeric({ length: 5 })}`.toLowerCase();
    const email = faker.datatype.boolean() ? faker.internet.email({ firstName: first, lastName: last }).toLowerCase() : null;
    const phone = faker.datatype.boolean() ? phoneWithLeading('7') : null;
    const teacher = await prisma.teacher.upsert({ where: { username }, update: {}, create: {
      username, name: first, surname: last, email, phone, address: faker.location.streetAddress(),
      img: faker.datatype.boolean() ? faker.image.avatar() : null,
      bloodType: pick(['A','B','AB','O']), sex: faker.datatype.boolean() ? UserSex.MALE : UserSex.FEMALE,
      birthday: faker.date.past({ years: 35, refDate: new Date('2000-01-01') })
    }});
    teachers.push(teacher);
  }

  const classes = [];
  for (let i=0;i<20;i++){
    const grade = pick(grades);
    const name = `Class ${grade.level}-${faker.string.alphanumeric({ length: 3 }).toUpperCase()}`;
    const supervisor = faker.datatype.boolean() ? pick(teachers) : null;
    const cls = await prisma.class.upsert({ where: { name }, update: {}, create: {
      name, capacity: faker.number.int({ min: 20, max: 40 }), gradeId: grade.id, supervisorId: supervisor ? supervisor.id : null
    }});
    classes.push(cls);
  }

  const students = [];
  for (let i=0;i<111;i++){
    const first = faker.person.firstName();
    const last = faker.person.lastName();
    const username = `${first}.${last}.${faker.string.alphanumeric({ length: 6 })}`.toLowerCase();
    const email = faker.datatype.boolean() ? faker.internet.email({ firstName: first, lastName: last }).toLowerCase() : null;
    const phone = faker.datatype.boolean() ? phoneWithLeading('8') : null;
    const cls = pick(classes);
    const grade = grades.find(g => g.id === cls.gradeId);
    const parent = pick(parents);
    const student = await prisma.student.upsert({ where: { username }, update: {}, create: {
      username, name: first, surname: last, email, phone, address: faker.location.streetAddress(),
      img: faker.datatype.boolean() ? faker.image.avatar() : null, bloodType: pick(['A','B','AB','O']),
      sex: faker.datatype.boolean() ? UserSex.MALE : UserSex.FEMALE, birthday: faker.date.birthdate({ min: 6, max: 18, mode: 'age' }),
      classId: cls.id, gradeId: grade.id, parentId: parent.id
    }});
    students.push(student);
  }

  const lessons = [];
  for (let i=0;i<20;i++){
    const subject = pick(subjects);
    const cls = pick(classes);
    const teacher = pick(teachers);
    const day = pick(DAYS);
    const startHour = faker.number.int({ min: 9, max: 15 });
    const dateBase = faker.date.soon({ days: 7 });
    const startTime = new Date(dateBase);
    startTime.setHours(startHour,0,0,0);
    const endTime = new Date(startTime.getTime() + 60*60*1000);
    const lesson = await prisma.lesson.create({ data: {
      name: `${subject.name} - ${cls.name}`, day, startTime, endTime, subjectId: subject.id, classId: cls.id, teacherId: teacher.id
    }});
    lessons.push(lesson);
  }

  // Create assignments (40)
  const assignments = [];
  for (let i=0;i<40;i++){
    const lesson = pick(lessons);
    const start = faker.date.soon({ days: 7 });
    const due = new Date(start.getTime() + faker.number.int({ min: 3, max: 14 }) * 24 * 60 * 60 * 1000);
    const assignment = await prisma.assignment.create({ data: { title: `${lesson.name} - Assignment ${i+1}`, startDate: start, dueDate: due, lessonId: lesson.id }});
    assignments.push(assignment);
  }

  // Create exams (40)
  const exams = [];
  for (let i=0;i<40;i++){
    const lesson = pick(lessons);
    const start = faker.date.soon({ days: 14 });
    const end = new Date(start.getTime() + faker.number.int({ min: 30, max: 180 }) * 60 * 1000);
    const exam = await prisma.exam.create({ data: { title: `${lesson.name} - Exam ${i+1}`, startTime: start, endTime: end, lessonId: lesson.id }});
    exams.push(exam);
  }

  // Create results for some exams and assignments
  const results = [];
  // create results for first 30 exams
  for (let i=0;i<30 && i<exams.length;i++){
    const exam = exams[i];
    const roster = faker.helpers.arrayElements(students, Math.min(10, students.length));
    for (const s of roster) {
      const r = await prisma.result.create({ data: { score: faker.number.int({ min: 40, max: 100 }), examId: exam.id, studentId: s.id }});
      results.push(r);
    }
  }
  // create results for first 30 assignments
  for (let i=0;i<30 && i<assignments.length;i++){
    const asg = assignments[i];
    const roster = faker.helpers.arrayElements(students, Math.min(10, students.length));
    for (const s of roster) {
      const r = await prisma.result.create({ data: { score: faker.number.int({ min: 40, max: 100 }), assignmentId: asg.id, studentId: s.id }});
      results.push(r);
    }
  }

  for (let i=0;i<20;i++){
    const maybeClass = faker.datatype.boolean() ? pick(classes) : null;
    await prisma.announcement.create({ data: { title: faker.company.buzzPhrase(), description: faker.lorem.sentences({ min:1, max:3 }), date: faker.date.recent({ days: 30 }), classId: maybeClass ? maybeClass.id : null }});
  }

  for (let i=0;i<20;i++){
    const maybeClass = faker.datatype.boolean() ? pick(classes) : null;
    const start = faker.date.soon({ days: 30 });
    const end = new Date(start.getTime() + faker.number.int({ min: 30, max: 120 }) * 60 * 1000);
    await prisma.event.create({ data: { title: faker.lorem.words({ min:2, max:4 }), description: faker.lorem.sentence(), startTime: start, endTime: end, classId: maybeClass ? maybeClass.id : null }});
  }

  for (const lesson of lessons.slice(0,10)){
    const roster = faker.helpers.arrayElements(students, 8);
    for (const s of roster) {
      await prisma.attendance.create({ data: { date: lesson.startTime, present: faker.datatype.boolean(0.85), lessonId: lesson.id, studentId: s.id }});
    }
  }

  console.log('✅ Seed complete.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
