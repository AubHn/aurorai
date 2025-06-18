import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1  px-6 py-12">
        {children}
      </main>
      <Footer />
    </div>
  )
}
