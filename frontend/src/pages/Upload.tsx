import { useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import '../styles/page.css'
import Slider from 'react-slick'
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa'
import jsPDF from 'jspdf'


function Arrow(props: any) {
  const { onClick, direction } = props
  return (
    <div
      className={`absolute top-1/2 transform -translate-y-1/2 z-20 cursor-pointer ${direction === 'left' ? 'left-10' : 'right-10'}`}
      style={{ backgroundColor: '#fcb900', borderRadius: '50%', padding: '0.75rem' }}
      onClick={onClick}
    >
      {direction === 'left' ? <FaArrowLeft color="white" size={20} /> : <FaArrowRight color="white" size={20} />}
    </div>
  )
}

const hazardDescriptions: Record<string, {
  description: string;
  impact: string[];
  recommendations: string[];
}> = {
  "crocodile crack": {
    description: "Crocodile cracks indicate fatigue of the pavement often caused by repeated traffic loading.",
    impact: [
      "Risk of tire damage and loss of vehicle control.",
      "Indicates structural failure requiring deeper repair."
    ],
    recommendations: [
      "Perform full-depth patching to remove fatigued sections.",
      "Reinforce pavement base layers."
    ]
  },
  "lateral crack": {
    description: "Lateral cracks run perpendicular to the road and often occur due to temperature changes.",
    impact: [
      "Water can infiltrate and erode the base material.",
      "Can expand and lead to potholes."
    ],
    recommendations: [
      "Seal cracks with appropriate fillers.",
      "Monitor temperature-related expansion patterns."
    ]
  },
  "longitudinal crack": {
    description: "Longitudinal cracks run parallel to the direction of traffic and may indicate poor lane bonding.",
    impact: [
      "May lead to separation of pavement layers.",
      "Trip hazard for two-wheelers."
    ],
    recommendations: [
      "Seal the cracks early to prevent widening.",
      "Inspect sublayers for structural integrity."
    ]
  },
  "pothole": {
    description: "Potholes are cavities caused by the breakdown of pavement surface and base layers.",
    impact: [
      "High risk of vehicle damage and accidents.",
      "Reduces driving comfort and safety."
    ],
    recommendations: [
      "Patch potholes immediately with hot or cold mix asphalt.",
      "Investigate root causes to avoid recurrence."
    ]
  }
}

const formatTime = (frameNumber: number, fps: number): string => {
  const totalSeconds = Math.floor(frameNumber / fps)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds}s`
}

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [result, setResult] = useState<string>('')
  const [hazards, setHazards] = useState<string[]>([])
  const [videoReport, setVideoReport] = useState<any[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loading, setLoading] = useState(false)
  const [analysisDone, setAnalysisDone] = useState(false)
  const [fps, setFps] = useState<number>(30)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setPreviewUrl(URL.createObjectURL(selectedFile))
      setResult('')
      setHazards([])
      setVideoReport([])
      setAnalysisDone(false)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)

    const formData = new FormData()
    formData.append('file', file)

    const isVideo = file.type.startsWith('video/')
    const res = await fetch(`http://127.0.0.1:8000/${isVideo ? 'analyze_video' : 'predict'}`, {
      method: 'POST',
      body: isVideo ? (formData.append('interval_seconds', '1.0'), formData) : formData,
    })

    const data = await res.json()
    if (isVideo) {
      setVideoReport(data.video_analysis || [])
      if (data.fps) setFps(data.fps)
    } else {
      setResult(`data:image/jpeg;base64,${data.image}`)
      setHazards(data.classes || [])
    }

    setLoading(false)
    setAnalysisDone(true)
  }

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    afterChange: (index: number) => setCurrentSlide(index),
    nextArrow: <Arrow direction="right" />,
    prevArrow: <Arrow direction="left" />,
  }
const downloadPDF = () => {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.setTextColor('#fcb900')
  doc.text('AurorAI Report', 20, 20)

  let y = 35

  const addHazardToPDF = (label: string) => {
    const hazard = hazardDescriptions[label]
    if (!hazard) return

    doc.setFontSize(14)
    doc.setTextColor('#000000')
    doc.text(`Hazard: ${label}`, 20, y)
    y += 8

    doc.setFontSize(12)
    doc.text('Description:', 20, y)
    y += 6
    doc.setFont('normal')
    doc.text(doc.splitTextToSize(hazard.description, 170), 20, y)
    y += 10

    doc.setFont('bold')
    doc.text('Impact:', 20, y)
    y += 6
    doc.setFont('normal')
    hazard.impact.forEach(item => {
      doc.text(`• ${item}`, 25, y)
      y += 6
    })

    doc.setFont('bold')
    doc.text('Recommendations:', 20, y)
    y += 6
    doc.setFont('normal')
    hazard.recommendations.forEach(item => {
      doc.text(`• ${item}`, 25, y)
      y += 6
    })

    y += 10
  }

  if (result && hazards.length > 0) {
    hazards.forEach(hazard => addHazardToPDF(hazard))
  } else if (currentFrame && currentFrame.detections.length > 0) {
    currentFrame.detections.forEach((det: any) => addHazardToPDF(det.label))
  }

  doc.save('AurorAI_Report.pdf')
}

  const filteredFrames = videoReport.filter(f => f.detections && f.detections.length > 0)
  const currentFrame = filteredFrames[currentSlide]

  return (
    <AppLayout>
      <div className="flex flex-col items-center w-full">
        {!analysisDone && (
          <div className="w-full flex flex-col items-center justify-center mt-14">
            <div className="bg-black border border-gray-800 rounded-2xl p-10 max-w-xl w-full text-center transition-all duration-300">
              <h1 className="text-3xl font-extrabold text-[#fcb900] mb-6">
                🚀 Upload your file for analysis
              </h1>
              <p className="text-white mb-8">
                Upload an <strong>image</strong> or <strong>video</strong> file to detect road hazards using AI.
              </p>
              <label htmlFor="file-upload" className="inline-flex items-center justify-center bg-white hover:bg-[#e3e1dc] text-[#fcb900] font-semibold px-6 py-3 rounded-lg  cursor-pointer transition-all duration-200">
                📁 Choose File
                <input id="file-upload" type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
              </label>
              {previewUrl && (
                <div className="mt-8 w-full">
                  {file?.type.startsWith('image/') ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-[280px] rounded-lg border border-gray-300 shadow" />
                  ) : (
                    <video src={previewUrl} controls className="w-full h-auto max-h-[280px] rounded-lg border border-gray-300 shadow" />
                  )}
                </div>
              )}
              {file && !result && videoReport.length === 0 && (
                <button onClick={handleUpload} disabled={loading} className="mt-6 bg-white text-[#fcb900] px-6 py-3 rounded-lg font-semibold hover:bg-[#e3e1dc] transition duration-200">
                  {loading ? 'Analyzing...' : 'Analyze'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

{(result || filteredFrames.length > 0) && (
  <>
    <div className="flex flex-row w-[90%] gap-12 mt-8">
      {filteredFrames.length > 0 && (
        <div className="w-[60%]">
          <h2 className="text-2xl font-semibold mb-4 text-left">🎥 Frame Viewer</h2>
          <Slider {...sliderSettings}>
            {filteredFrames.map((frame, index) =>
              frame.image_url ? (
                <div key={index} className="relative px-4 h-[550px] flex justify-center items-center">
                  <img
                    src={`http://127.0.0.1:8000${frame.image_url}`}
                    alt={`Frame ${frame.frame}`}
                    className="w-full h-auto rounded border"
                  />
                </div>
              ) : null
            )}
            
          </Slider>
          {currentFrame && (
            <div className="mt-4 text-center text-gray-800">
              <p className="font-medium text-base">
                Frame {currentFrame.frame} ({formatTime(currentFrame.frame, fps)})
              </p>
            </div>
          )}
        </div>
        
      )}
      

      {result && (
        <div className="w-[60%]">
          <h2 className="text-2xl font-semibold mb-4 text-left">🖼️ Image Analysis</h2>
          <img src={result} alt="Result" className="w-full h-auto rounded border" />
        </div>
      )}

      <div className="w-[40%]">
        {currentFrame && currentFrame.detections.length > 0 && (
          <div className="mt-8 p-6 border rounded-xl shadow-md bg-white text-left w-full">
            <h3 className="text-xl font-semibold mb-2">📄 Report</h3>
            {currentFrame.detections.map((det: any, i: number) => {
              const hazard = hazardDescriptions[det.label]
              if (!hazard) return null
              return (
                <div key={i} className="mb-6">
                  <p className="mb-2 text-gray-800">{hazard.description}</p>
                  <p className="font-semibold text-[#fcb900]">Impact :</p>
                  <ul className="list-disc list-inside mb-3 text-gray-700">
                    {hazard.impact.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ul>
                  <p className="font-semibold text-[#fcb900]">Recommendations:</p>
                  <ul className="list-disc list-inside text-gray-700">
                    {hazard.recommendations.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ul>
                </div>
              )
            })}
            
            <div className="flex justify-end mt-4">
      <button
        onClick={downloadPDF}
        className="bg-[#fcb900] text-black px-4 py-2 rounded hover:bg-yellow-400 transition font-semibold"
      >
        📄 Download Report
      </button>
    </div>
          </div>
          
          
        )}
        

        {result && hazards.length > 0 && (
          <div className="mt-8 p-6 border rounded-xl shadow-md bg-white text-left w-full">
            <h3 className="text-xl font-semibold mb-2">📄 Report</h3>
            {hazards.map((hazard, i) => {
              const info = hazardDescriptions[hazard]
              if (!info) return null
              return (
                <div key={i} className="mb-6">
                  <p className="mb-2 text-gray-800">{info.description}</p>
                  <p className="font-semibold text-[#fcb900]">Impact :</p>
                  <ul className="list-disc list-inside mb-3 text-gray-700">
                    {info.impact.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ul>
                  <p className="font-semibold text-[#fcb900]">Recommendations:</p>
                  <ul className="list-disc list-inside text-gray-700">
                    {info.recommendations.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ul>
                </div>
              )
              
            })}
             <div className="flex justify-end mt-4">
      <button
        onClick={downloadPDF}
        className="bg-[#fcb900] text-black px-4 py-2 rounded hover:bg-yellow-400 transition font-semibold"
      >
        📄 Download Report
      </button>
    </div>
          </div>
          
        )}
      </div>
      
    </div>



  </>
  
)}
</AppLayout>
  )
}
