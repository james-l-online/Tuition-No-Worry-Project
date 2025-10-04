import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import db from "@/lib/db";
import { ITEM_PER_PAGE } from "@/lib/settings";
import type { Class, Teacher } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

type ClassList = Class & { supervisor: Teacher };

const ClassListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {

const { sessionClaims } = auth();
const role = (sessionClaims?.metadata as { role?: string })?.role;


const columns = [
  {
    header: "Class Name",
    accessor: "name",
  },
  {
    header: "Capacity",
    accessor: "capacity",
    className: "hidden md:table-cell",
  },
  {
    header: "Grade",
    accessor: "grade",
    className: "hidden md:table-cell",
  },
  {
    header: "Supervisor",
    accessor: "supervisor",
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

const renderRow = (item: ClassList) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
  >
    <td className="flex items-center gap-4 p-4">{item.name}</td>
    <td className="hidden md:table-cell">{item.capacity}</td>
    <td className="hidden md:table-cell">{item.name ? item.name[0] : ""}</td>
    <td className="hidden md:table-cell">
      {item.supervisor ? `${item.supervisor.name} ${item.supervisor.surname}` : "—"}
    </td>
    <td>
      <div className="flex items-center gap-2">
        {role === "admin" && (
          <>
            <FormContainer table="class" type="update" data={item} />
            <FormContainer table="class" type="delete" id={item.id} />
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
          case 'supervisorId':
            whereClauses.push(`c.supervisor_id = $${idx}`)
            params.push(value)
            idx++
            break
          case 'search':
            whereClauses.push(`c.name ILIKE $${idx}`)
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

  const dataSql = `SELECT c.*, json_build_object('id', t.id, 'name', t.name, 'surname', t.surname) AS supervisor
    FROM class c
    LEFT JOIN teacher t ON t.id = c.supervisor_id
    ${whereSQL}
  ORDER BY c.name ASC
    LIMIT $${idx} OFFSET $${idx + 1}`
  params.push(ITEM_PER_PAGE, ITEM_PER_PAGE * (p - 1))

  const countSql = `SELECT COUNT(*) AS count FROM class c ${whereSQL}`

  const dataRes = await db.query(dataSql, params)
  const countRes = await db.query(countSql, params.slice(0, params.length - 2))
  const data = dataRes.rows.map((r: any) => ({ ...r, supervisor: r.supervisor || null }))
  const count = Number(countRes.rows[0]?.count || 0)

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Classes</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && <FormContainer table="class" type="create" />}
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

export default ClassListPage;
