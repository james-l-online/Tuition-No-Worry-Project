import Table from "@/components/Table";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import db from "@/lib/db";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

type AttendanceRow = {
  id: number;
  date: string;
  present: boolean;
  student: { name: string; surname: string };
  lesson: { name: string };
};

const AttendancePage = async ({ searchParams }: { searchParams: { [key: string]: string | undefined } }) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const columns = [
    { header: "Student", accessor: "student" },
    { header: "Lesson", accessor: "lesson" },
    { header: "Date", accessor: "date", className: "hidden md:table-cell" },
    { header: "Present", accessor: "present" },
    ...(role === "admin" || role === "teacher" ? [{ header: "Actions", accessor: "action" }] : []),
  ];

  const renderRow = (item: AttendanceRow) => (
    <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight">
      <td className="flex items-center gap-4 p-4">{item.student.name} {item.student.surname}</td>
      <td>{item.lesson.name}</td>
  <td className="hidden md:table-cell">{new Intl.DateTimeFormat("en-US").format(new Date(item.date))}</td>
      <td>{item.present ? "Present" : "Absent"}</td>
      <td>
        {/* actions could be added here */}
      </td>
    </tr>
  );

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // Build WHERE clauses and params
  const where: string[] = [];
  const params: any[] = [];

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "studentId":
            params.push(value);
            where.push(`a.student_id = $${params.length}`);
            break;
          case "lessonId":
            params.push(parseInt(value));
            where.push(`a.lesson_id = $${params.length}`);
            break;
          case "search":
            params.push(`%${value}%`);
            where.push(`s.name ILIKE $${params.length}`);
            break;
          default:
            break;
        }
      }
    }
  }

  switch (role) {
    case "admin":
      break;
    case "teacher":
      // lessons taught by current user
      params.push(currentUserId);
  where.push(`l.teacher_id::text = $${params.length}`);
      break;
    case "student":
      params.push(currentUserId);
      where.push(`a.student_id = $${params.length}`);
      break;
    case "parent":
      params.push(currentUserId);
      where.push(`s.parent_id = $${params.length}`);
      break;
    default:
      break;
  }

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const offset = ITEM_PER_PAGE * (p - 1);

  const dataRes = await db.query(
    `SELECT a.id, a.date, a.present, json_build_object('name', s.name, 'surname', s.surname) AS student, json_build_object('name', l.name) AS lesson
      FROM attendance a
      JOIN student s ON s.id = a.student_id
      JOIN lesson l ON l.id = a.lesson_id
      ${whereSQL}
      ORDER BY a.date DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, ITEM_PER_PAGE, offset]
  );

  const countRes = await db.query(
    `SELECT COUNT(*) AS count
      FROM attendance a
      JOIN student s ON s.id = a.student_id
      JOIN lesson l ON l.id = a.lesson_id
      ${whereSQL}`,
    params
  );

  const data: AttendanceRow[] = dataRes.rows.map((r: any) => ({
    id: r.id,
    date: r.date,
    present: r.present,
    student: r.student,
    lesson: r.lesson,
  }));

  const count = parseInt(countRes.rows[0]?.count ?? "0");

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Attendance</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
            <div className="flex items-center gap-4 self-end">
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                <Image src="/filter.png" alt="" width={14} height={14} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                <Image src="/create.png" alt="" width={14} height={14} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                <Image src="/sort.png" alt="" width={14} height={14} />
              </button>
          </div>
        </div>
      </div>

      <Table columns={columns} renderRow={renderRow} data={data} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default AttendancePage;
