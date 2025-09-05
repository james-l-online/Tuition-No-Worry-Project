"use client"
import React from 'react';
import Image from 'next/image';
import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';


type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

//temporary event data
const events = [
  {
    id: 1,
    title: "Meeting with John",
    time: "2:00 PM",
    description: "Discuss project updates and next steps.",
  },
  { 
    id: 2,
    title: "Parent-Teacher Conference",
    time: "11:00 AM",
    description: "Meeting with parents to discuss student progress.",
  },
  {
    id: 3,
    title: "Staff Meeting",
    time: "4:00 PM",
    description: "Monthly staff meeting to discuss school policies.",
  },
];


const EventCalendar = () => {
  const [value, onChange] = useState<Value>(new Date());

  return (
    <div className='bg-white p-4 rounded-md'>
      <Calendar onChange={onChange} value={value}/>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-semibold my-4'>Events</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20}/>
      </div>
      <div className='flex flex-col gap-4'>
        {events.map((event) => (
          <div 
          className='p-5 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-lamaSky even:border-t-lamaPurple' key={event.id}>
            <div className='flex justify-between items-center'>
              <h1 className='font-semibold text-gray-900
              '>{event.title}</h1>
              <span className='text-gray-400 text-sm'>{event.time}</span>
            </div>
            <p className='mt-2 text-gray-400 text-sm'>{event.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EventCalendar