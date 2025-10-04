// Ambient shim to satisfy TypeScript imports of `@prisma/client` after removing Prisma.
// This provides minimal type placeholders so the codebase continues to compile.

declare module "@prisma/client" {
  // Minimal common model types used across the app. Add more if the compiler reports missing types.
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

  // Export a placeholder PrismaClient class so any `new PrismaClient()` usages (if present) will type-check
  export class PrismaClient { constructor(...args:any[]); }
  const db: PrismaClient;
  export default db;
}
