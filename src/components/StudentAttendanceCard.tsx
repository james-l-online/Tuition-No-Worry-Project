import db from "@/lib/db";

const StudentAttendanceCard = async ({ id }: { id: string }) => {
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const res = await db.query(
    `SELECT present FROM attendance WHERE student_id = $1 AND date >= $2`,
    [id, startOfYear]
  );

  const attendance = res.rows;

  const totalDays = attendance.length;
  const presentDays = attendance.filter((day: any) => day.present).length;
  const percentage = (presentDays / totalDays) * 100;
  return (
    <div className="">
      <h1 className="text-xl font-semibold">{percentage || "-"}%</h1>
      <span className="text-sm text-gray-400">Attendance</span>
    </div>
  );
};

export default StudentAttendanceCard;
