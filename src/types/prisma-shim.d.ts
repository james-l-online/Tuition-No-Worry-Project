// Lightweight TypeScript shim for `@prisma/client` to keep the repo compiling
// while Prisma is removed. These are permissive placeholders for development.

declare module "@prisma/client" {
  // Minimal model placeholders. Extend if the compiler reports missing types.
  export type Class = any;
  export type Teacher = any;
  export type Student = any;
  export type Parent = any;
  export type Lesson = any;
  export type Subject = any;
  export type Assignment = any;
  export type Exam = any;
  export type Result = any;
  export type Attendance = any;
  export type Announcement = any;
  export type Event = any;
  export type Admin = any;
  export type Prisma = any;
  export type Day = any;
  export type UserSex = any;

  // Export a placeholder PrismaClient so existing `new PrismaClient()` calls type-check
  export class PrismaClient { constructor(...args:any[]); }
  const db: PrismaClient;
  export default db;
}
