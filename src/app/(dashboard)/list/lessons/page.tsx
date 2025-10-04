import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import db from "@/lib/db";
import { ITEM_PER_PAGE } from "@/lib/settings";
import type { Class, Lesson, Subject, Teacher } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

type LessonList = Lesson & { subject: Subject } & { class: Class } & {
  teacher: Teacher;
};


const LessonListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {

const { sessionClaims } = auth();
const role = (sessionClaims?.metadata as { role?: string })?.role;


const columns = [
  {
    header: "Subject Name",
    accessor: "name",
  },
  {
    header: "Class",
    accessor: "class",
  },
  {
    header: "Teacher",
    accessor: "teacher",
    className: "hidden md:table-cell",
  },
  ...(role === "admin"
    ? [
        {
          header: "Actions",
          accessor: "action",
        },
      ]
    : []),
];

const renderRow = (item: LessonList) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
  >
    <td className="flex items-center gap-4 p-4">{item.subject.name}</td>
    <td>{item.class.name}</td>
    <td className="hidden md:table-cell">
      {item.teacher.name + " " + item.teacher.surname}
    </td>
    <td>
      <div className="flex items-center gap-2">
        {role === "admin" && (
          <>
            <FormContainer table="lesson" type="update" data={item} />
            <FormContainer table="lesson" type="delete" id={item.id} />
          </>
        )}
      </div>
    </td>
  </tr>
);

  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // Build WHERE clauses and params
  const whereClauses: string[] = []
  const params: any[] = []
  let idx = 1
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case 'classId':
            whereClauses.push(`l.class_id = $${idx}`)
            params.push(parseInt(value))
            idx++
            break
          case 'teacherId':
            whereClauses.push(`l.teacher_id::text = $${idx}`)
            params.push(value)
            idx++
            break
          case 'search':
            whereClauses.push(`(s.name ILIKE $${idx} OR t.name ILIKE $${idx})`)
            params.push(`%${value}%`)
            idx++
            break
          default:
            break
        }
      }
    }
  }

  const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''

  const dataSql = `SELECT l.*, s.id AS subject_id, s.name AS subject_name, c.id AS class_id, c.name AS class_name, t.id AS teacher_id, t.name AS teacher_name, t.surname AS teacher_surname
    FROM lesson l
    JOIN subject s ON s.id = l.subject_id
    JOIN class c ON c.id = l.class_id
    LEFT JOIN teacher t ON t.id = l.teacher_id
    ${whereSQL}
    ORDER BY l.created_at DESC
    LIMIT $${idx} OFFSET $${idx + 1}`
  params.push(ITEM_PER_PAGE, ITEM_PER_PAGE * (p - 1))

  const countSql = `SELECT COUNT(*) AS count FROM lesson l ${whereSQL}`

  const dataRes = await db.query(dataSql, params)
  const countRes = await db.query(countSql, params.slice(0, params.length - 2))

  const data = dataRes.rows.map((r: any) => ({
    ...r,
    subject: { id: r.subject_id, name: r.subject_name },
    class: { id: r.class_id, name: r.class_name },
    teacher: r.teacher_id ? { id: r.teacher_id, name: r.teacher_name, surname: r.teacher_surname } : null,
  }))

  const count = Number(countRes.rows[0]?.count || 0)

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Lessons</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && <FormContainer table="lesson" type="create" />}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default LessonListPage;
