import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import db from "@/lib/db";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

type EventList = any;

const EventListPage = async ({
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
    {
      header: "Start Time",
      accessor: "startTime",
      className: "hidden md:table-cell",
    },
    {
      header: "End Time",
      accessor: "endTime",
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

  const renderRow = (item: EventList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.title}</td>
      <td>{item.class?.name || "-"}</td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("en-US").format(item.startTime)}
      </td>
      <td className="hidden md:table-cell">
        {item.startTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}
      </td>
      <td className="hidden md:table-cell">
        {item.endTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormContainer table="event" type="update" data={item} />
              <FormContainer table="event" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // Build SQL WHERE clauses and params
  const whereClauses: string[] = [];
  const params: any[] = [];

  // search
  if (queryParams && queryParams.search) {
    params.push(`%${queryParams.search}%`);
    whereClauses.push(`e.title ILIKE $${params.length}`);
  }

  // role-based condition: (class_id IS NULL OR <roleCondition>)
  let roleCondition = "TRUE";
  if (role === "teacher") {
    params.push(currentUserId);
  roleCondition = `e.class_id IN (SELECT class_id FROM lesson WHERE teacher_id::text = $${params.length})`;
  } else if (role === "student") {
    params.push(currentUserId);
    roleCondition = `e.class_id = (SELECT class_id FROM student WHERE id = $${params.length})`;
  } else if (role === "parent") {
    params.push(currentUserId);
    roleCondition = `e.class_id IN (SELECT class_id FROM student WHERE parent_id = $${params.length})`;
  } else {
    // admin or unspecified role -> allow all
    roleCondition = "TRUE";
  }

  whereClauses.push(`(e.class_id IS NULL OR (${roleCondition}))`);

  const whereSql = whereClauses.length ? whereClauses.join(" AND ") : "TRUE";

  const limit = ITEM_PER_PAGE;
  const offset = ITEM_PER_PAGE * (p - 1);

  const dataSql = `SELECT e.id, e.title, e.description, e.start_time as "startTime", e.end_time as "endTime", e.class_id, c.name as "class_name", c.id as "class_id" FROM event e LEFT JOIN class c ON e.class_id = c.id WHERE ${whereSql} ORDER BY e.start_time DESC LIMIT ${limit} OFFSET ${offset}`;

  const countSql = `SELECT COUNT(*)::int as count FROM event e WHERE ${whereSql}`;

  const dataRes = await db.query(dataSql, params);
  const countRes = await db.query(countSql, params);

  const data = dataRes.rows.map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    startTime: r.startTime,
    endTime: r.endTime,
    class: r.class_id ? { id: r.class_id, name: r.class_name } : null,
  }));

  const count = countRes.rows[0] ? Number(countRes.rows[0].count) : 0;

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Events</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && <FormContainer table="event" type="create" />}
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

export default EventListPage;
