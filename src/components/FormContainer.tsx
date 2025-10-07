import db from "@/lib/db";
import FormModal from "./FormModal";
import { auth } from "@clerk/nextjs/server";

export type FormContainerProps = {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
  triggerImage?: string;
};

const FormContainer = async ({ table, type, data, id, triggerImage }: FormContainerProps) => {
  let relatedData = {};

  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  if (type !== "delete") {
    switch (table) {
      case "subject":
        const tRes = await db.query(`SELECT id, name, surname FROM teacher ORDER BY name`)
        relatedData = { teachers: tRes.rows };
        break;
      case "class":
        const gRes = await db.query(`SELECT id, level FROM grade ORDER BY level`)
        const ctRes = await db.query(`SELECT id, name, surname FROM teacher ORDER BY name`)
        relatedData = { teachers: ctRes.rows, grades: gRes.rows };
        break;
      case "teacher":
        const sRes = await db.query(`SELECT id, name FROM subject ORDER BY name`)
        relatedData = { subjects: sRes.rows };
        break;
      case "student":
        const sgRes = await db.query(`SELECT id, level FROM grade ORDER BY level`)
        const scRes = await db.query(`SELECT c.*, (SELECT COUNT(*) FROM student s WHERE s.class_id = c.id) as students_count FROM class c ORDER BY c.name`)
        relatedData = { classes: scRes.rows, grades: sgRes.rows };
        break;
      case "exam":
        let examSql = `SELECT id, name FROM lesson`
        const examParams: any[] = []
        if (role === "teacher") {
          examSql += ` WHERE teacher_id::text = $1`
          examParams.push(currentUserId)
        }
        const elRes = await db.query(examSql, examParams)
        relatedData = { lessons: elRes.rows };
        break;

      default:
        break;
    }
  }

  return (
    <div className="">
      <FormModal
        table={table}
        type={type}
        data={data}
        id={id}
        relatedData={relatedData}
        triggerImage={triggerImage}
      />
    </div>
  );
};

export default FormContainer;
