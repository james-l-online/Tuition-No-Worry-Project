export const dynamic = "force-dynamic";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";

const columns = [
  { header: "Date", accessor: "date" },
  { header: "Class", accessor: "class", className: "hidden md:table-cell" },
  { header: "Present", accessor: "present", className: "hidden md:table-cell" },
  { header: "Absent", accessor: "absent", className: "hidden md:table-cell" },
  { header: "Actions", accessor: "action" },
];

const data: any[] = [];

export default function AttendanceListPage() {
  const renderRow = (item: any) => (
    <tr key={item.date} className="border-b border-gray-200 even:bg-slate-50 text-sm">
      <td className="p-4">{item.date}</td>
      <td className="hidden md:table-cell">{item.class}</td>
      <td className="hidden md:table-cell">{item.present}</td>
      <td className="hidden md:table-cell">{item.absent}</td>
      <td>—</td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Attendance</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={data} />
      <Pagination />
    </div>
  );
}
