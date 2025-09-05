"use client"
import { BarChart, Bar, Rectangle, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import React from 'react';
import Image from 'next/image';

const data = [
  {
    name: 'Mon',
    present: 40,
    absent: 4,
    },
  {
    name: 'Tue',
    present: 30,
    absent: 5,
    },
  {
    name: 'Wed',
    present: 28,
    absent: 12,
    },
  {
    name: 'Thu',
    present: 27,
    absent: 4,
    },
  {
    name: 'Fri',
    present: 48,
    absent: 5,
    },
  {
    name: 'Sat',
    present: 23,
    absent: 3,
    },
  {
    name: 'Sun',
    present: 30,
    absent: 2,
    },
];

const AttendanceChart = () => {
  return (
  <div className='bg-white rounded-lg p-4 flex-col p-4 h-full'>
    <div className='flex justify-between items-center'>
      <h1 className='text-lg font-semibold'>Attendance</h1>
      <Image src="/moreDark.png" alt="" width={20} height={20}/>
    </div>
    <ResponsiveContainer width="100%" height="90%">
      <BarChart
        width={500}
        height={300}
        data={data}
        barSize={20}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd"/>
        <XAxis dataKey="name" axisLine={false} tick={{fill:"#d1d5db"}} tickLine={false}/>
        <YAxis axisLine={false} tick={{fill:"#d1d5db"}} tickLine={false}/>
        <Tooltip contentStyle={{ borderRadius: "10px", borderColor:"lightgray"}}/>
        <Legend align='left' verticalAlign='top' wrapperStyle={{ paddingTop: "20px", paddingBottom: "40px" }}/>
      <Bar dataKey="present" 
        fill="#FACC15" 
        legendType='circle'
        radius={[10, 10, 0, 0]} 
        />
      <Bar dataKey="absent" 
        fill="#83a6ed" 
        legendType='circle' 
        radius={[10, 10, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
  );
}

export default AttendanceChart