import Image from 'next/image'
import React from 'react'


const UserCard = ({type}:{type:string}) => {
  return (
    <div className='rounded-2xl odd:bg-lamaPurple even:bg-lamaYellow p-4 flex-1'>
      <div className="">
        <span>2025/26</span>
        <Image src="/more.png" alt="" width={20} height={20}/>
      </div>
      <h1>1,234</h1>
      <h2>stgvavs</h2>
    </div>
  )
}

export default UserCard