import { Link } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import '../styles/page.css'
import logo from '../assets/aurorai-logo.png'

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center text-center space-y-6">
      
        <img src={logo} alt="AurorAI Logo" style={{ width: '500px', height: '500px' }} />
        <p className="text-gray-600 text-lg">Your smart assistant for road risk analysis</p>

        <Link to="/upload" className="primary-button mt-4">
          Start a new analysis
        </Link>
      </div>

     
    </AppLayout>
  )
}
