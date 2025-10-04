import db from "@/lib/db";
import BigCalendar from "./BigCalender";
import { adjustScheduleToCurrentWeek } from "@/lib/utils";

const BigCalendarContainer = async ({
  type,
  id,
}: {
  type: "teacherId" | "classId";
  id: string | number;
}) => {
  const where = type === "teacherId" ? `teacher_id::text = $1` : `class_id = $1`
  const res = await db.query(`SELECT name, start_time, end_time FROM lesson WHERE ${where}`, [id])
  const data = res.rows.map((lesson: any) => ({
    title: lesson.name,
    start: lesson.start_time,
    end: lesson.end_time,
  }))

  const schedule = adjustScheduleToCurrentWeek(data);

  return (
    <div className="">
      <BigCalendar data={schedule} />
    </div>
  );
};

export default BigCalendarContainer;
