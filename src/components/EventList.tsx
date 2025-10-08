import db from "@/lib/db";


const EventList = async ({
  dateParam,
  search,
}: {
  dateParam: string | undefined;
  search?: string;
}) => {
  const date = dateParam ? new Date(dateParam) : new Date();

  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));

  let sql = `SELECT * FROM event WHERE start_time >= $1 AND start_time <= $2`;
  const params: any[] = [startOfDay, endOfDay];
  if (search) {
    sql += ` AND (title ILIKE $3 OR description ILIKE $3)`;
    params.push(`%${search}%`);
  }

  const res = await db.query(sql, params);
  const data = res.rows;

  return data.map((event: any) => (
    <div
      className="p-5 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-lamaSky even:border-t-lamaPurple"
      key={event.id}
    >
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-gray-600">{event.title}</h1>
        <span className="text-gray-300 text-xs">
          {(() => {
            // DB row may have `start_time` (snake_case) or `startTime` (camelCase)
            const raw = event.startTime ?? event.start_time ?? null;
            if (!raw) return "-";
            const dt = raw instanceof Date ? raw : new Date(raw);
            if (isNaN(dt.getTime())) return "-";
            return dt.toLocaleTimeString("en-UK", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
          })()}
        </span>
      </div>
      <p className="mt-2 text-gray-400 text-sm">{event.description}</p>
    </div>
  ));
};

export default EventList;