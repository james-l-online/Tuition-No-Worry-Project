import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

const Announcements = async () => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Build role-based visibility SQL
  let whereClause = "";
  const params: any[] = [];

  if (role !== "admin") {
    switch (role) {
      case "teacher":
        params.push(userId);
  whereClause = `WHERE (a.class_id IS NULL OR EXISTS (SELECT 1 FROM lesson l WHERE l.class_id = a.class_id AND l.teacher_id::text = $1))`;
        break;
      case "student":
        params.push(userId);
        whereClause = `WHERE (a.class_id IS NULL OR EXISTS (SELECT 1 FROM student s WHERE s.id = $1 AND EXISTS (SELECT 1 FROM class_student cs WHERE cs.class_id = a.class_id AND cs.student_id = s.id)))`;
        break;
      case "parent":
        params.push(userId);
        whereClause = `WHERE (a.class_id IS NULL OR EXISTS (SELECT 1 FROM student s WHERE s.parent_id = $1 AND EXISTS (SELECT 1 FROM class_student cs WHERE cs.class_id = a.class_id AND cs.student_id = s.id)))`;
        break;
      default:
        whereClause = "WHERE a.class_id IS NULL";
    }
  }

  const res = await db.query(
    `SELECT a.id, a.title, a.description, a.date
      FROM announcement a
      ${whereClause}
      ORDER BY a.date DESC
      LIMIT 3`,
    params
  );

  const data = res.rows;

  return (
    <div className="bg-white p-4 rounded-md">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Announcements</h1>
        <span className="text-xs text-gray-400">View All</span>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {data[0] && (
          <div className="bg-lamaSkyLight rounded-md p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{data[0].title}</h2>
              <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
                {new Intl.DateTimeFormat("en-GB").format(data[0].date)}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{data[0].description}</p>
          </div>
        )}
        {data[1] && (
          <div className="bg-lamaPurpleLight rounded-md p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{data[1].title}</h2>
              <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
                {new Intl.DateTimeFormat("en-GB").format(data[1].date)}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{data[1].description}</p>
          </div>
        )}
        {data[2] && (
          <div className="bg-lamaYellowLight rounded-md p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{data[2].title}</h2>
              <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
                {new Intl.DateTimeFormat("en-GB").format(data[2].date)}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{data[2].description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;
