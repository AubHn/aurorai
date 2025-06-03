import { useState } from 'react'
import jsPDF from 'jspdf'
import AppLayout from '../layouts/AppLayout'
import '../styles/page.css'

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [result, setResult] = useState<string>('')
  const [hazards, setHazards] = useState<string[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setImageUrl(URL.createObjectURL(selectedFile))
      setResult('')
      setHazards([])
    }
  }

  const handleUpload = async () => {
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('http://127.0.0.1:8000/predict', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    setResult(`data:image/jpeg;base64,${data.image}`)
    setHazards(data.classes || [])
  }

  const handleDownload = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result
    a.download = 'prediction.jpg'
    a.click()
  }

  const handleDownloadReport = () => {
    if (hazards.length === 0) return

    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text("AurorAI - Detection Report", 20, 20)

    doc.setFontSize(12)
    doc.text("Detected hazards in the uploaded image:", 20, 30)

    hazards.forEach((hazard, i) => {
      doc.text(`- ${hazard}`, 20, 40 + i * 10)
    })

    doc.save('aurorai_detection_report.pdf')
  }

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center w-full">
        <h1 className="page-title text-center  mb-6">Upload an image for analysis</h1>

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mb-6"
        />

        {imageUrl && (
          <div className="flex flex-col md:flex-row gap-10 items-start justify-center">
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-2">Original Image</h2>
              <img
                src={imageUrl}
                alt="Uploaded"
                className="w-[420px] h-auto rounded border border-gray-300"
              />
            </div>

            {result && (
              <div className="text-center">
                <h2 className="text-lg font-semibold mb-2">Prediction</h2>
                <img
                  src={result}
                  alt="Prediction"
                  className="w-[420px] h-auto rounded border border-indigo-400"
                />
              </div>
            )}
          </div>
        )}

        {imageUrl && !result && (
          <button
            onClick={handleUpload}
            className="primary-button mt-6"
          >
            Analyze Image
          </button>
        )}

        {imageUrl && result && (
          <div className="mt-6">
            <button
              onClick={handleDownload}
              className="primary-button mt-6 bg-[#fcb900] hover:bg-[#e0a800] text-black"
            >
              Download Result
            </button>

          </div>
        )}

    {hazards.length > 0 && (
  <>
    <div className="mt-10 p-6 border rounded-xl w-full max-w-xl shadow-md bg-white text-left">
      <h2 className="text-xl font-semibold mb-3">📝 Detection Report</h2>
      <p className="text-gray-700 mb-2">The following road hazards were detected in the image:</p>
      <ul className="list-disc list-inside text-gray-800">
        {hazards.map((hazard, index) => (
          <li key={index}>{hazard}</li>
        ))}
      </ul>
    </div>

    <div className="mt-4 text-center">
      <button
        onClick={handleDownloadReport}
        className="primary-button bg-[#fcb900] hover:bg-[#e0a800] text-black"
      >
        Download Report as PDF
      </button>

    </div>
  </>
)}

      </div>
    </AppLayout>
  )
}
