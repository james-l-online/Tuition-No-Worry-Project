const Table = ({
  columns,
  renderRow,
  data
}:{
  columns:{header:string; accessor:string; className?: string }[];
  renderRow: (item:any) => React.ReactNode
}) => {
  return (
    <table className='w-full mt-4'>
      <thead>
        <tr className="text-left text-gray-600 text-sm">
          {columns.map((col)=>(
            <th key={col.assessor}>{col.header}</th>
          ))}
        </tr>

      </thead>
    </table>
  )
}

export default Table