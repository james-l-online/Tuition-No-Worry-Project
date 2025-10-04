import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import db from "@/lib/db";
import { ITEM_PER_PAGE } from "@/lib/settings";
import type { Announcement, Class, Prisma } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";


type AnnouncementList = Announcement & { class: Class };
const AnnouncementListPage = async ({
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
      header: "Class",
      accessor: "class",
    },
    {
      header: "Date",
      accessor: "date",
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
  
  const renderRow = (item: AnnouncementList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.title}</td>
      <td>{item.class?.name || "-"}</td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("en-US").format(item.date)}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormContainer table="announcement" type="update" data={item} />
              <FormContainer table="announcement" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );
  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  // Build WHERE clauses
  const whereClauses: string[] = []
  const params: any[] = []
  let idx = 1

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            whereClauses.push(`a.title ILIKE $${idx}`)
            params.push(`%${value}%`)
            idx++
            break;
          default:
            break;
        }
      }
    }
  }

  // Role-based visibility: announcements where class_id IS NULL OR class is visible to user
  // We'll implement teacher/student/parent restrictions using EXISTS subqueries
  const visibilityClauses: string[] = []
  visibilityClauses.push(`a.class_id IS NULL`)
  if (role === "teacher") {
    visibilityClauses.push(`EXISTS (SELECT 1 FROM lesson l WHERE l.class_id = a.class_id AND l.teacher_id = $${idx})`)
    params.push(currentUserId)
    idx++
  } else if (role === "student") {
    visibilityClauses.push(`EXISTS (SELECT 1 FROM student s WHERE s.class_id = a.class_id AND s.id = $${idx})`)
    params.push(currentUserId)
    idx++
  } else if (role === "parent") {
    visibilityClauses.push(`EXISTS (SELECT 1 FROM student s WHERE s.class_id = a.class_id AND s.parent_id = $${idx})`)
    params.push(currentUserId)
    idx++
  }

  const visibilitySQL = `(${visibilityClauses.join(' OR ')})`
  if (visibilitySQL) {
    whereClauses.push(visibilitySQL)
  }

  const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''

  const dataSql = `SELECT a.*, json_build_object('id', c.id, 'name', c.name) AS class FROM announcement a LEFT JOIN class c ON c.id = a.class_id ${whereSQL} ORDER BY a.date DESC LIMIT $${idx} OFFSET $${idx + 1}`
  params.push(ITEM_PER_PAGE, ITEM_PER_PAGE * (p - 1))

  const countSql = `SELECT COUNT(*)::int AS count FROM announcement a LEFT JOIN class c ON c.id = a.class_id ${whereSQL}`

  const dataRes = await db.query(dataSql, params)
  const countRes = await db.query(countSql, params.slice(0, params.length - 2))
  const data = dataRes.rows.map((r: any) => ({ ...r, class: r.class || null }))
  const count = Number(countRes.rows[0]?.count || 0)

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          All Announcements
        </h1>
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
              <FormContainer table="announcement" type="create" />
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

export default AnnouncementListPage;
