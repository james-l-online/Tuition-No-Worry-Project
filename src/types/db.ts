export type UUID = string

export type Admin = {
  id: UUID
  username: string
}

export type Teacher = {
  id: UUID
  username: string
  name: string
  surname: string
  email?: string
  phone?: string
  address: string
  img?: string
  blood_type: string
  sex: 'MALE' | 'FEMALE'
  created_at?: string
  birthday: string
}

export type Parent = {
  id: UUID
  username: string
  name: string
  surname: string
  email?: string
  phone: string
  address: string
  created_at?: string
}

export type Grade = { id: number; level: number }

export type ClassItem = { id: number; name: string; capacity: number; supervisor_id?: UUID | null; grade_id: number }

export type Subject = { id: number; name: string }

export type Student = {
  id: UUID
  username: string
  name: string
  surname: string
  email?: string
  phone?: string
  address: string
  img?: string
  blood_type: string
  sex: 'MALE' | 'FEMALE'
  created_at?: string
  parent_id: UUID
  class_id: number
  grade_id: number
  birthday: string
}
