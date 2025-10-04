// Prisma is being deprecated in this project. Use `src/lib/db.ts` (pg) instead.
// This file now exports a shim that instructs developers to migrate.

function shim() {
  const message = `Prisma client is deprecated in this repo. Please use src/lib/db.ts and SQL migrations/seeds instead.`
  if (process.env.NODE_ENV === 'production') {
    throw new Error(message)
  }
  // In non-production, return a proxy that throws when methods are accessed to make
  // it obvious and easy to find call sites that need migration.
  return new Proxy({}, {
    get(_target, prop) {
      return () => { throw new Error(`${message} Attempted to call prisma.${String(prop)}()`)}
    }
  })
}

// Export as `any` to keep existing call sites compiling while we migrate off Prisma.
const prisma: any = shim()
export default prisma