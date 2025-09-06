const Pagination = () => {
  return (
    <div className='p-4 flex items-center justify-between text-gray-500'>
      <button className="py-2 px-4 rounded-md bg-slate-300 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed">Prev</button>
      <div className="">
        <button className="px-2 rounded -sm bg-lamaSky">1</button>
        <button className="px-2 rounded -sm ">2</button>
        <button className="px-2 rounded -sm ">3</button>
          ... 
        <button className="px-2 rounded -sm ">10</button>
      </div>
      <button className="py-2 px-4 rounded-md bg-slate-300 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
    </div>
  )
}

export default Pagination