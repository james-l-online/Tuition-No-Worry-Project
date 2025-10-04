import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import db from "@/lib/db";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Image from "next/image";

import { auth } from "@clerk/nextjs/server";

type ResultList = {
  id: number;
  title: string;
  studentName: string;
  studentSurname: string;
  teacherName: string;
  teacherSurname: string;
  score: number;
  className: string;
  startTime: Date;
};


const ResultListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {

const { userId, sessionClaims } = auth();
const role = (sessionClaims?.metadata as { role?: string })?.role;
const currentUserId = userId;


const columns = [
  {
    header: "Title",
    accessor: "title",
  },
  {
    header: "Student",
    accessor: "student",
  },
  {
    header: "Score",
    accessor: "score",
    className: "hidden md:table-cell",
  },
  {
    header: "Teacher",
    accessor: "teacher",
    className: "hidden md:table-cell",
  },
  {
    header: "Class",
    accessor: "class",
    className: "hidden md:table-cell",
  },
  {
    header: "Date",
    accessor: "date",
    className: "hidden md:table-cell",
  },
  ...(role === "admin" || role === "teacher"
    ? [
        {
          header: "Actions",
          accessor: "action",
        },
      ]
    : []),
];

const renderRow = (item: ResultList) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
  >
    <td className="flex items-center gap-4 p-4">{item.title}</td>
    <td>{item.studentName + " " + item.studentName}</td>
    <td className="hidden md:table-cell">{item.score}</td>
    <td className="hidden md:table-cell">
      {item.teacherName + " " + item.teacherSurname}
    </td>
    <td className="hidden md:table-cell">{item.className}</td>
    <td className="hidden md:table-cell">
      {new Intl.DateTimeFormat("en-US").format(item.startTime)}
    </td>
    <td>
      <div className="flex items-center gap-2">
        {(role === "admin" || role === "teacher") && (
          <>
            <FormContainer table="result" type="update" data={item} />
            <FormContainer table="result" type="delete" id={item.id} />
          </>
        )}
      </div>
    </td>
  </tr>
);

  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  // Build WHERE clauses and params
  const where: string[] = [];
  const params: any[] = [];

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "studentId":
            params.push(value);
            where.push(`r.student_id = $${params.length}`);
            break;
          case "search":
            params.push(`%${value}%`);
            where.push(`(ex.title ILIKE $${params.length} OR s.name ILIKE $${params.length})`);
            break;
          default:
            break;
        }
      }
    }
  }

  // ROLE CONDITIONS
  switch (role) {
    case "admin":
      break;
    case "teacher":
      params.push(currentUserId);
  where.push(`(lex_ex.teacher_id::text = $${params.length} OR lex_asg.teacher_id::text = $${params.length})`);
      break;
    case "student":
      params.push(currentUserId);
      where.push(`r.student_id = $${params.length}`);
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
    `SELECT r.id,
      COALESCE(ex.title, asg.title) AS title,
      s.name AS student_name, s.surname AS student_surname,
      COALESCE(t_ex.name, t_asg.name) AS teacher_name,
      COALESCE(t_ex.surname, t_asg.surname) AS teacher_surname,
      r.score,
      COALESCE(c_ex.name, c_asg.name) AS class_name,
      COALESCE(ex.start_time, asg.start_date) AS start_time
    FROM result r
    JOIN student s ON s.id = r.student_id
    LEFT JOIN exam ex ON ex.id = r.exam_id
    LEFT JOIN lesson lex_ex ON lex_ex.id = ex.lesson_id
    LEFT JOIN teacher t_ex ON t_ex.id = lex_ex.teacher_id
    LEFT JOIN class c_ex ON c_ex.id = lex_ex.class_id
    LEFT JOIN assignment asg ON asg.id = r.assignment_id
    LEFT JOIN lesson lex_asg ON lex_asg.id = asg.lesson_id
    LEFT JOIN teacher t_asg ON t_asg.id = lex_asg.teacher_id
    LEFT JOIN class c_asg ON c_asg.id = lex_asg.class_id
    ${whereSQL}
    ORDER BY start_time DESC NULLS LAST
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, ITEM_PER_PAGE, offset]
  );

  const countRes = await db.query(
    `SELECT COUNT(*) AS count
    FROM result r
    JOIN student s ON s.id = r.student_id
    LEFT JOIN exam ex ON ex.id = r.exam_id
    LEFT JOIN lesson lex_ex ON lex_ex.id = ex.lesson_id
    LEFT JOIN assignment asg ON asg.id = r.assignment_id
    LEFT JOIN lesson lex_asg ON lex_asg.id = asg.lesson_id
    ${whereSQL}`,
    params
  );

  const data = dataRes.rows.map((item: any) => ({
    id: item.id,
    title: item.title,
    studentName: item.student_name,
    studentSurname: item.student_surname,
    teacherName: item.teacher_name,
    teacherSurname: item.teacher_surname,
    score: item.score,
    className: item.class_name,
    startTime: item.start_time ? new Date(item.start_time) : null,
  }));

  const count = parseInt(countRes.rows[0]?.count ?? "0");

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Results</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {(role === "admin" || role === "teacher") && (
              <FormContainer table="result" type="create" />
            )}
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

export default ResultListPage;
