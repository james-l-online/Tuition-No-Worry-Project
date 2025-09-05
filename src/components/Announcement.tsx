"use client"

const Announcement = () => {
  return (
    <div className='bg-white p-4 rounded-md'>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Announcements</h1>
        <span className="text-xs text-gray-600">View All</span>
      </div>
      <div className="flex flex-col gap-4 mt-4">
      <div className="bg-lamaSkyLight rounded-md p-4">
        <div className="flex items justify-between">
          <h2 className="font-semibold text-gray-900">
            Loren ipsum dolor sit
          </h2>
          <span className="text-xs text-gray-500 bg-white rounded ">
            2 hours ago
          </span>
        </div>
      </div>
      </div>
    </div>
  )
}

export default Announcement