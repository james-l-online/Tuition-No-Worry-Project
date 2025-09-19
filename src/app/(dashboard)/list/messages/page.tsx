export const dynamic = "force-dynamic";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";

const columns = [
  { header: "From", accessor: "from" },
  { header: "To", accessor: "to", className: "hidden md:table-cell" },
  { header: "Subject", accessor: "subject", className: "hidden md:table-cell" },
  { header: "Date", accessor: "date", className: "hidden lg:table-cell" },
  { header: "Actions", accessor: "action" },
];

const data: any[] = [];

export default function MessagesListPage() {
  const renderRow = (item: any) => (
    <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 text-sm">
      <td className="p-4">{item.from}</td>
      <td className="hidden md:table-cell">{item.to}</td>
      <td className="hidden md:table-cell">{item.subject}</td>
      <td className="hidden lg:table-cell">{item.date}</td>
      <td>—</td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Messages</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={data} />
      <Pagination />
    </div>
  );
}
