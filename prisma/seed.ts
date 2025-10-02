import { PrismaClient, Day, UserSex } from "@prisma/client";
import type {
  Subject,
  Grade,
  Admin,
  Parent,
  Teacher,
  Class as ClassModel,
  Student as StudentModel,
  Lesson as LessonModel,
} from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

// helpers
const phoneWithLeading = (leading: string) => `${leading}${faker.string.numeric(8)}`; // 9 digits total
const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const unique = (gen: () => string, count: number) => {
  const s = new Set<string>();
  while (s.size < count) s.add(gen());
  return Array.from(s);
};
const DAYS: Day[] = [Day.MONDAY, Day.TUESDAY, Day.WEDNESDAY, Day.THURSDAY, Day.FRIDAY];

async function main() {
  // ---------- SUBJECTS (20 unique names) ----------
  const subjectNames = unique(() => faker.word.noun({ length: { min: 5, max: 12 } })
    .replace(/[^a-z]/gi, "")
    .slice(0, 1).toUpperCase() + faker.word.noun().slice(1), 20);
  const subjects: Subject[] = [];
  for (const name of subjectNames) {
    const subject = await prisma.subject.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    subjects.push(subject);
  }

  // ---------- GRADES (5 levels) ----------
  const gradeLevels = [1, 2, 3, 4, 5];
  const grades: Grade[] = [];
  for (const level of gradeLevels) {
    const grade = await prisma.grade.upsert({
      where: { level },
      update: {},
      create: { level },
    });
    grades.push(grade);
  }

  // ---------- ADMINS (8) ----------
  for (let i = 0; i < 8; i++) {
    const username = `admin_${faker.string.alphanumeric({ length: 10 })}`.toLowerCase();
    await prisma.admin.upsert({
      where: { username },
      update: {},
      create: { id: faker.string.uuid(), username },
    });
  }

  // ---------- PARENTS (80) ----------
  const parentPhones = unique(() => phoneWithLeading("9"), 80); // unique phones
  const parents: Parent[] = [];
  for (let i = 0; i < 80; i++) {
    const first = faker.person.firstName();
    const last = faker.person.lastName();
    const username = `${first}.${last}.${faker.string.alphanumeric({ length: 4 })}`.toLowerCase();
    const email = faker.internet.email({ firstName: first, lastName: last }).toLowerCase();
    const parent = await prisma.parent.upsert({
      where: { username },
      update: {},
      create: {
        id: faker.string.uuid(),
        username,
        name: first,
        surname: last,
        email,
        phone: parentPhones[i],
        address: faker.location.streetAddress(),
      },
    });
    parents.push(parent);
  }

  // ---------- TEACHERS (12) ----------
  const teachers: Teacher[] = [];
  for (let i = 0; i < 12; i++) {
    const first = faker.person.firstName();
    const last = faker.person.lastName();
    const username = `${first}.${last}.${faker.string.alphanumeric({ length: 5 })}`.toLowerCase();
    const email = faker.datatype.boolean() ? faker.internet.email({ firstName: first, lastName: last }).toLowerCase() : null;
    const phone = faker.datatype.boolean() ? phoneWithLeading("7") : null;
    const teacher = await prisma.teacher.upsert({
      where: { username },
      update: {},
      create: {
        id: faker.string.uuid(),
        username,
        name: first,
        surname: last,
        email,
        phone,
        address: faker.location.streetAddress(),
        img: faker.datatype.boolean() ? faker.image.avatar() : null,
        bloodType: pick(["A", "B", "AB", "O"]),
        sex: faker.datatype.boolean() ? UserSex.MALE : UserSex.FEMALE,
        birthday: faker.date.past({ years: 35, refDate: new Date("2000-01-01") }),
      },
    });
    teachers.push(teacher);
  }

  // ---------- CLASSES (20) ----------
  const classes: ClassModel[] = [];
  for (let i = 0; i < 20; i++) {
    const grade = pick(grades);
    const name = `Class ${grade.level}-${faker.string.alphanumeric({ length: 3 }).toUpperCase()}`;
    const supervisor = faker.datatype.boolean() ? pick(teachers) : null;
    const cls = await prisma.class.upsert({
      where: { name },
      update: {},
      create: {
        name,
        capacity: faker.number.int({ min: 20, max: 40 }),
        gradeId: grade.id,
        supervisorId: supervisor ? supervisor.id : null,
      },
    });
    classes.push(cls);
  }

  // ---------- STUDENTS (111) ----------
  const students: StudentModel[] = [];
  for (let i = 0; i < 111; i++) {
    const first = faker.person.firstName();
    const last = faker.person.lastName();
    const username = `${first}.${last}.${faker.string.alphanumeric({ length: 6 })}`.toLowerCase();
    const email = faker.datatype.boolean() ? faker.internet.email({ firstName: first, lastName: last }).toLowerCase() : null;
    const phone = faker.datatype.boolean() ? phoneWithLeading("8") : null;
    const cls = pick(classes);
    const grade = grades.find(g => g.id === cls.gradeId)!;
    const parent = pick(parents);
    const student = await prisma.student.upsert({
      where: { username },
      update: {},
      create: {
        id: faker.string.uuid(),
        username,
        name: first,
        surname: last,
        email,
        phone,
        address: faker.location.streetAddress(),
        img: faker.datatype.boolean() ? faker.image.avatar() : null,
        bloodType: pick(["A", "B", "AB", "O"]),
        sex: faker.datatype.boolean() ? UserSex.MALE : UserSex.FEMALE,
        birthday: faker.date.birthdate({ min: 6, max: 18, mode: "age" }),
        classId: cls.id,
        gradeId: grade.id,
        parentId: parent.id,
      },
    });
    students.push(student);
  }

  // ---------- LESSONS (20) ----------
  const lessons: LessonModel[] = [];
  for (let i = 0; i < 20; i++) {
    const subject = pick(subjects);
    const cls = pick(classes);
    const teacher = pick(teachers);
    const day = pick(DAYS);

    // random time next week aligned to a day (9:00–16:00)
    const startHour = faker.number.int({ min: 9, max: 15 });
    const dateBase = faker.date.soon({ days: 7 });
    // align to weekday-ish (not exact but fine for seed)
    const startTime = new Date(dateBase);
    startTime.setHours(startHour, 0, 0, 0);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    const lesson = await prisma.lesson.create({
      data: {
        name: `${subject.name} - ${cls.name}`,
        day,
        startTime,
        endTime,
        subjectId: subject.id,
        classId: cls.id,
        teacherId: teacher.id,
      },
    });
    lessons.push(lesson);
  }

  // ---------- ANNOUNCEMENTS (20) ----------
  for (let i = 0; i < 20; i++) {
    const maybeClass = faker.datatype.boolean() ? pick(classes) : null;
    await prisma.announcement.create({
      data: {
        title: faker.company.buzzPhrase(),
        description: faker.lorem.sentences({ min: 1, max: 3 }),
        date: faker.date.recent({ days: 30 }),
        classId: maybeClass ? maybeClass.id : null,
      },
    });
  }

  // ---------- EVENTS (20) ----------
  for (let i = 0; i < 20; i++) {
    const maybeClass = faker.datatype.boolean() ? pick(classes) : null;
    const start = faker.date.soon({ days: 30 });
    const end = new Date(start.getTime() + faker.number.int({ min: 30, max: 120 }) * 60 * 1000);
    await prisma.event.create({
      data: {
        title: faker.lorem.words({ min: 2, max: 4 }),
        description: faker.lorem.sentence(),
        startTime: start,
        endTime: end,
        classId: maybeClass ? maybeClass.id : null,
      },
    });
  }

  // OPTIONAL: Make some lesson attendance & simple results
  // (small numbers to keep it quick)
  for (const lesson of lessons.slice(0, 10)) {
    const roster = faker.helpers.arrayElements(students, 8);
    for (const s of roster) {
      await prisma.attendance.create({
        data: {
          date: lesson.startTime,
          // faker.datatype.boolean does not accept a probability argument in typings;
          // use Math.random() for a probability check to keep types happy.
          present: Math.random() < 0.85,
          lessonId: lesson.id,
          studentId: s.id,
        },
      });
    }
  }

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
