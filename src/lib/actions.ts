"use server";

import { revalidatePath } from "next/cache";
import {
  ClassSchema,
  ExamSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
} from "./formValidationSchemas";
import db from "./db";
import { clerkClient } from "@clerk/nextjs/server";

type CurrentState = { success: boolean; error: boolean };

export const createSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    // create subject and link teachers in transaction
    const client = await db.getClient()
    try {
      await client.query("BEGIN")
      const insertRes = await client.query(
        `INSERT INTO subject (name, created_at, updated_at) VALUES ($1, now(), now()) RETURNING id`,
        [data.name]
      )
      const subjectId = insertRes.rows[0].id
      if (data.teachers && data.teachers.length) {
        const values: string[] = []
        const params: any[] = []
        let idx = 1
        for (const tId of data.teachers) {
          values.push(`($${idx}, $${idx + 1})`)
          params.push(subjectId, parseInt(tId))
          idx += 2
        }
        await client.query(
          `INSERT INTO subject_teacher (subject_id, teacher_id) VALUES ${values.join(",")}`,
          params
        )
      }
      await client.query("COMMIT")
    } catch (e) {
      await client.query("ROLLBACK")
      throw e
    } finally {
      client.release()
    }

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    const client = await db.getClient()
    try {
      await client.query("BEGIN")
      await client.query(`UPDATE subject SET name=$1, updated_at=now() WHERE id=$2`, [data.name, data.id])
      // reset teachers
      await client.query(`DELETE FROM subject_teacher WHERE subject_id=$1`, [data.id])
      if (data.teachers && data.teachers.length) {
        const values: string[] = []
        const params: any[] = []
        let idx = 1
        for (const tId of data.teachers) {
          values.push(`($${idx}, $${idx + 1})`)
          params.push(data.id, parseInt(tId))
          idx += 2
        }
        await client.query(
          `INSERT INTO subject_teacher (subject_id, teacher_id) VALUES ${values.join(",")}`,
          params
        )
      }
      await client.query("COMMIT")
    } catch (e) {
      await client.query("ROLLBACK")
      throw e
    } finally {
      client.release()
    }

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteSubject = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await db.query(`DELETE FROM subject WHERE id=$1`, [parseInt(id)])

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await db.query(
      `INSERT INTO class (name, capacity, grade_id, supervisor_id, created_at, updated_at) VALUES ($1,$2,$3,$4,now(),now())`,
      [data.name, data.capacity, data.gradeId, data.supervisorId || null]
    )

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await db.query(
      `UPDATE class SET name=$1, capacity=$2, grade_id=$3, supervisor_id=$4, updated_at=now() WHERE id=$5`,
      [data.name, data.capacity, data.gradeId, data.supervisorId || null, data.id]
    )

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await db.query(`DELETE FROM class WHERE id=$1`, [parseInt(id)])

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    const user = await clerkClient.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata:{role:"teacher"}
    });

    const client = await db.getClient()
    try {
      await client.query("BEGIN")
      await client.query(
        `INSERT INTO teacher (id, username, name, surname, email, phone, address, img, blood_type, sex, birthday, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now(),now())`,
        [
          user.id,
          data.username,
          data.name,
          data.surname,
          data.email || null,
          data.phone || null,
          data.address,
          data.img || null,
          data.bloodType,
          data.sex,
          data.birthday,
        ]
      )
      if (data.subjects && data.subjects.length) {
        const values: string[] = []
        const params: any[] = []
        let idx = 1
        for (const sId of data.subjects) {
          values.push(`($${idx}, $${idx + 1})`)
          params.push(parseInt(sId), user.id)
          idx += 2
        }
        // note: order (subject_id, teacher_id)
        await client.query(
          `INSERT INTO subject_teacher (subject_id, teacher_id) VALUES ${values.join(",")}`,
          params
        )
      }
      await client.query("COMMIT")
    } catch (e) {
      await client.query("ROLLBACK")
      throw e
    } finally {
      client.release()
    }

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const user = await clerkClient.users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    const client = await db.getClient()
    try {
      await client.query("BEGIN")
      await client.query(
        `UPDATE teacher SET username=$1, name=$2, surname=$3, email=$4, phone=$5, address=$6, img=$7, blood_type=$8, sex=$9, birthday=$10, updated_at=now() WHERE id=$11`,
        [
          data.username,
          data.name,
          data.surname,
          data.email || null,
          data.phone || null,
          data.address,
          data.img || null,
          data.bloodType,
          data.sex,
          data.birthday,
          data.id,
        ]
      )
      // reset subject links
      await client.query(`DELETE FROM subject_teacher WHERE teacher_id=$1`, [data.id])
      if (data.subjects && data.subjects.length) {
        const values: string[] = []
        const params: any[] = []
        let idx = 1
        for (const sId of data.subjects) {
          values.push(`($${idx}, $${idx + 1})`)
          params.push(parseInt(sId), data.id)
          idx += 2
        }
        await client.query(
          `INSERT INTO subject_teacher (subject_id, teacher_id) VALUES ${values.join(",")}`,
          params
        )
      }
      await client.query("COMMIT")
    } catch (e) {
      await client.query("ROLLBACK")
      throw e
    } finally {
      client.release()
    }
    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await clerkClient.users.deleteUser(id);
    await db.query(`DELETE FROM teacher WHERE id=$1`, [id])

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  console.log(data);
  try {
    // check class capacity
    const classRes = await db.query(`SELECT capacity, (SELECT COUNT(*) FROM student WHERE class_id = $1) as students_count FROM class WHERE id=$1`, [data.classId])
    const classRow = classRes.rows[0]
    if (classRow && classRow.capacity === Number(classRow.students_count)) {
      return { success: false, error: true }
    }

    const user = await clerkClient.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata:{role:"student"}
    });

    await db.query(
      `INSERT INTO student (id, username, name, surname, email, phone, address, img, blood_type, sex, birthday, grade_id, class_id, parent_id, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,now(),now())`,
      [
        user.id,
        data.username,
        data.name,
        data.surname,
        data.email || null,
        data.phone || null,
        data.address,
        data.img || null,
        data.bloodType,
        data.sex,
        data.birthday,
        data.gradeId,
        data.classId,
        data.parentId,
      ]
    )

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const user = await clerkClient.users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });
    await db.query(
      `UPDATE student SET username=$1, name=$2, surname=$3, email=$4, phone=$5, address=$6, img=$7, blood_type=$8, sex=$9, birthday=$10, grade_id=$11, class_id=$12, parent_id=$13, updated_at=now() WHERE id=$14`,
      [
        data.username,
        data.name,
        data.surname,
        data.email || null,
        data.phone || null,
        data.address,
        data.img || null,
        data.bloodType,
        data.sex,
        data.birthday,
        data.gradeId,
        data.classId,
        data.parentId,
        data.id,
      ]
    )
    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await clerkClient.users.deleteUser(id);
    await db.query(`DELETE FROM student WHERE id=$1`, [id])

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  // const { userId, sessionClaims } = auth();
  // const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    // if (role === "teacher") {
    //   const teacherLesson = await prisma.lesson.findFirst({
    //     where: {
    //       teacherId: userId!,
    //       id: data.lessonId,
    //     },
    //   });

    //   if (!teacherLesson) {
    //     return { success: false, error: true };
    //   }
    // }

    await db.query(`INSERT INTO exam (title, start_time, end_time, lesson_id, created_at, updated_at) VALUES ($1,$2,$3,$4,now(),now())`, [data.title, data.startTime, data.endTime, data.lessonId])

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  // const { userId, sessionClaims } = auth();
  // const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    // if (role === "teacher") {
    //   const teacherLesson = await prisma.lesson.findFirst({
    //     where: {
    //       teacherId: userId!,
    //       id: data.lessonId,
    //     },
    //   });

    //   if (!teacherLesson) {
    //     return { success: false, error: true };
    //   }
    // }

    await db.query(`UPDATE exam SET title=$1, start_time=$2, end_time=$3, lesson_id=$4, updated_at=now() WHERE id=$5`, [data.title, data.startTime, data.endTime, data.lessonId, data.id])

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteExam = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  // const { userId, sessionClaims } = auth();
  // const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    await db.query(`DELETE FROM exam WHERE id=$1`, [parseInt(id)])

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};
