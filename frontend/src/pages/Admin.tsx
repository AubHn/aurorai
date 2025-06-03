import AppLayout from '../layouts/AppLayout'

export default function Admin() {
  return (
    <AppLayout>
      <div className="p-6 space-y-6 bg-gray-50 ">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4 min-h-[150px]">
            <h3 className="text-sm font-semibold">📊 Total Reports</h3>
            <p className="text-2xl text-[#fcb900] font-bold">125</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 min-h-[150px]">
            <h3 className="text-sm font-semibold">👥 Active Users</h3>
            <p className="text-2xl text-[#fcb900] font-bold">32</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 min-h-[150px]">
            <h3 className="text-sm font-semibold">⚠️ High Risk Segments</h3>
            <p className="text-2xl text-[#fcb900] font-bold">47</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-4 min-h-[150px]">
            <h3 className="text-sm font-semibold mb-2">🔥 Top Risk Zones</h3>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>A1 Highway Tunnel – Score 93</li>
              <li>Route D15 Roundabout – Score 89</li>
              <li>Bridge N4 Curve – Score 87</li>
              <li>Urban Blvd Exit – Score 85</li>
              <li>Country Road R21 – Score 83</li>
            </ol>
          </div>

          <div className="bg-white rounded-lg shadow p-4 min-h-[150px]">
            <h3 className="text-sm font-semibold mb-2">📈 User Growth Chart</h3>
            <div className="text-gray-400 text-sm italic">[ Chart Placeholder ]</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 min-h-[150px]">
          <h3 className="text-sm font-semibold mb-2">📅 Reports Submitted (Last 30 Days)</h3>
          <div className="text-gray-400 text-sm italic">[ Activity Graph Placeholder ]</div>
        </div>
      </div>
    </AppLayout>
  )
}
