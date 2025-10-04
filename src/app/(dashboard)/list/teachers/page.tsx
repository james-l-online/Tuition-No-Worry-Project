import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import db from "@/lib/db";
import type { Class, Subject, Teacher } from "@prisma/client";
import Image from "next/image";
import Avatar from "@/components/Avatar";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";

type TeacherList = Teacher & { subjects: Subject[] } & { classes: Class[] };

const TeacherListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const columns = [
    {
      header: "Info",
      accessor: "info",
    },
    {
      header: "Teacher ID",
      accessor: "teacherId",
      className: "hidden md:table-cell",
    },
    {
      header: "Subjects",
      accessor: "subjects",
      className: "hidden md:table-cell",
    },
    {
      header: "Classes",
      accessor: "classes",
      className: "hidden md:table-cell",
    },
    {
      header: "Phone",
      accessor: "phone",
      className: "hidden lg:table-cell",
    },
    {
      header: "Address",
      accessor: "address",
      className: "hidden lg:table-cell",
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

  const renderRow = (item: TeacherList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <Avatar
          src={item.img || "/noAvatar.png"}
          alt={`${item.name} avatar`}
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">{item?.email}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.username}</td>
      <td className="hidden md:table-cell">
        {item.subjects.map((subject: Subject) => subject.name).join(",")}
      </td>
      <td className="hidden md:table-cell">
        {item.classes.map((classItem: Class) => classItem.name).join(",")}
      </td>
      <td className="hidden md:table-cell">{item.phone}</td>
      <td className="hidden md:table-cell">{item.address}</td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/teachers/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
          </Link>
          {role === "admin" && (
            // <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple">
            //   <Image src="/delete.png" alt="" width={16} height={16} />
            // </button>
            <FormContainer table="teacher" type="delete" id={item.id} />
          )}
        </div>
      </td>
    </tr>
  );
  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  // Build SQL WHERE clauses from query params (simple translation)
  const whereClauses: string[] = []
  const params: any[] = []
  let idx = 1
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case 'classId':
            whereClauses.push(`t.id IN (SELECT teacher_id FROM subject_teacher st JOIN subject s ON s.id = st.subject_id WHERE s.id IN (SELECT subject_id FROM lesson WHERE class_id = $${idx}))`)
            params.push(parseInt(value))
            idx++
            break
          case 'search':
            whereClauses.push(`t.name ILIKE $${idx}`)
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

  // Fetch teachers with subjects and classes aggregated
  const dataSql = `SELECT t.*,
    (SELECT json_agg(json_build_object('id', s.id, 'name', s.name)) FROM subject s JOIN subject_teacher st ON s.id = st.subject_id WHERE st.teacher_id = t.id) AS subjects,
    (SELECT json_agg(json_build_object('id', c.id, 'name', c.name)) FROM class c WHERE c.supervisor_id = t.id) AS classes
    FROM teacher t
    ${whereSQL}
    ORDER BY t.created_at DESC
    LIMIT $${idx} OFFSET $${idx + 1}`
  params.push(ITEM_PER_PAGE, ITEM_PER_PAGE * (p - 1))

  const countSql = `SELECT COUNT(*) AS count FROM teacher t ${whereSQL}`

  const dataRes = await db.query(dataSql, params)
  const countRes = await db.query(countSql, params.slice(0, params.length - 2))
  const data = dataRes.rows.map((r: any) => ({ ...r, subjects: r.subjects || [], classes: r.classes || [] }))
  const count = Number(countRes.rows[0]?.count || 0)

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Teachers</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
            <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && (
              <FormContainer table="teacher" type="create" triggerImage="/create.png" />
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

export default TeacherListPage;
