import { useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import '../styles/page.css'
import Slider from 'react-slick'
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa'
import jsPDF from 'jspdf'
import logo from '../assets/aurorai-logo.png';


// Arrow component for the slider
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

// Hazard descriptions
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
  const [result, setResult] = useState<string>('') // for image analysis result
  const [hazards, setHazards] = useState<string[]>([])
  const [videoReport, setVideoReport] = useState<any[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loading, setLoading] = useState(false)
  const [analysisDone, setAnalysisDone] = useState(false)
  const [fps, setFps] = useState<number>(30)
  const [confidence, setConfidence] = useState<number>(0.5);

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

  if (isVideo) {
    formData.append('interval_seconds', '1.0')
    formData.append('confidence', confidence.toString()) 
  } else {
    formData.append('confidence', confidence.toString())
  }

  const res = await fetch(`http://127.0.0.1:8000/${isVideo ? 'analyze_video' : 'predict'}`, {
    method: 'POST',
    body: formData,
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

  const filteredFrames = videoReport.filter(f => f.detections && f.detections.length > 0);
  const currentFrame = filteredFrames[currentSlide];

  // Function to convert image URL to base64
  const getBase64FromUrl = async (url: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

const downloadPDF = async () => {
  const doc = new jsPDF();

  // Load logo
  const logoBase64 = await getBase64FromUrl(logo);

  // ✅ COVER PAGE

  doc.addImage(logoBase64, 'PNG', 20, 10, 30, 30);
  doc.setFontSize(30);
  doc.setTextColor('#000000');
  doc.text(
    'AurorAI Road Hazard Detection Report',
    doc.internal.pageSize.getWidth() / 2,
    doc.internal.pageSize.getHeight() / 2,
    { align: 'center' }
  );

  let y = 60;

  // ✅ Text block printer with safe paging
  const addHazardDetails = (label: string) => {
    const hazard = hazardDescriptions[label];
    if (!hazard) return;

    const safeWrite = (lines: string[]) => {
      lines.forEach(line => {
        doc.text(line, 20, y);
        y += 6;
        if (y > 270) {
          doc.addPage();
          doc.addImage(logoBase64, 'PNG', 20, 10, 30, 30);
          y = 30;
        }
      });
    };

    doc.setFontSize(14);
    doc.setTextColor('#000000');
    safeWrite([`Hazard: ${label}`]);
    y += 2;

    doc.setFontSize(12);
    safeWrite(['Description:']);
    safeWrite(doc.splitTextToSize(hazard.description, 170));
    y += 4;

    safeWrite(['Impact:']);
    hazard.impact.forEach(item => safeWrite([`• ${item}`]));
    y += 4;

    safeWrite(['Recommendations:']);
    hazard.recommendations.forEach(item => safeWrite([`• ${item}`]));
    y += 10;
  };

 // ✅ For image analysis
if (result && hazards.length > 0) {
  doc.addPage();
  doc.addImage(logoBase64, 'PNG', 20, 10, 30, 30);
  doc.setFontSize(14);
  doc.setTextColor('#000000');
  let y = 50;

  // Report details
  hazards.forEach(hazard => {
    const h = hazardDescriptions[hazard];
    if (!h) return;

    doc.setFontSize(12);
    doc.text(`Hazard: ${hazard}`, 20, y);
    y += 8;
    doc.text('Description:', 20, y); y += 6;
    doc.text(doc.splitTextToSize(h.description, 170), 20, y);
    y += h.description.length > 80 ? 16 : 10;

    doc.text('Impact:', 20, y); y += 6;
    h.impact.forEach(item => { doc.text(`• ${item}`, 25, y); y += 6 });

    doc.text('Recommendations:', 20, y); y += 6;
    h.recommendations.forEach(item => { doc.text(`• ${item}`, 25, y); y += 6 });

    y += 10;
    if (y > 250) {
      doc.addPage();
      doc.addImage(logoBase64, 'PNG', 20, 10, 30, 30);
      y = 40;
    }
  });

  // ➕ Then add the analyzed image on a new page
  const base64Data = result.split(',')[1]; // strip prefix
  doc.addPage();
  doc.addImage(logoBase64, 'PNG', 20, 10, 30, 30);
  doc.text('Analyzed Image:', 20, 40);
  doc.addImage(base64Data, 'JPEG', 20, 50, 160, 120);
}

  // ✅ For video analysis
  if (videoReport.length > 0 && filteredFrames.length > 0) {
    for (let i = 0; i < filteredFrames.length; i++) {
      const frame = filteredFrames[i];
      const frameUrl = `http://127.0.0.1:8000${frame.image_url}`;
      const imageBase64 = await getBase64FromUrl(frameUrl);

      doc.addPage();
      doc.addImage(logoBase64, 'PNG', 20, 10, 30, 30);
      doc.setFontSize(14);
      doc.text(`Frame ${frame.frame}`, 20, 40);
      doc.addImage(imageBase64, 'JPEG', 20, 50, 160, 100);
      y = 160;

      frame.detections.forEach((det: any) => {
        addHazardDetails(det.label);
      });
    }
  }

  doc.save('AurorAI_Report.pdf');
};


  return (
    <AppLayout>
      <div className="flex flex-col items-center w-full">

        {/* Upload Section */}
        {!analysisDone && (
          <div className="w-full flex flex-col items-center justify-center mt-14">
            <div className="bg-black border border-gray-800 rounded-2xl p-10 max-w-xl w-full text-center transition-all duration-300">
              <h1 className="text-3xl font-extrabold text-[#fcb900] mb-6">
                🚀 Upload your file for analysis
              </h1>
              <p className="text-white mb-8">
                Upload an <strong>image</strong> or <strong>video</strong> file to detect road hazards using AI.
              </p>
              <label htmlFor="file-upload" className="inline-flex items-center justify-center bg-white hover:bg-[#e3e1dc] text-[#fcb900] font-semibold px-6 py-3 rounded-lg cursor-pointer transition-all duration-200">
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
  <>
    {/* Slider Confidence */}
    <div className="mt-6 text-white text-left w-full">
      <label htmlFor="confidence" className="block text-sm mb-2">Confidence Threshold</label>
      <input
        type="range"
        id="confidence"
        min="0"
        max="1"
        step="0.01"
        value={confidence}
        onChange={(e) => setConfidence(parseFloat(e.target.value))}
        className="w-full accent-[#fcb900]"
      />
      <div className="flex justify-between text-sm mt-1 text-white">
        <span>0.00</span>
        <span className="text-center text-[#fcb900] font-semibold">{confidence.toFixed(2)}</span>
        <span>1.00</span>
      </div>
    </div>

    {/* Analyze button */}
    <button
      onClick={handleUpload}
      disabled={loading}
      className="mt-6 bg-white text-[#fcb900] px-6 py-3 rounded-lg font-semibold hover:bg-[#e3e1dc] transition duration-200"
    >
      {loading ? 'Analyzing...' : 'Analyze'}
    </button>
  </>
)}

            </div>
          </div>
        )}

        {/* Result Section */}
        {(result || filteredFrames.length > 0) && (
          <div className="flex flex-row w-[90%] gap-12 mt-8">
            {/* Frame Viewer */}
            {filteredFrames.length > 0 && (
              <div className="w-[60%]">
                <h2 className="text-2xl font-semibold mb-4 text-left">🎥 Frame Viewer</h2>
                <Slider {...sliderSettings}>
                  {filteredFrames.map((frame, index) =>
                    frame.image_url ? (
                      <div key={index} className="relative px-4 h-[550px] flex justify-center items-center">
                        <img src={`http://127.0.0.1:8000${frame.image_url}`} alt={`Frame ${frame.frame}`} className="w-full h-auto rounded border" />
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

            {/* Image Analysis */}
            {result && (
              <div className="w-[60%]">
                <h2 className="text-2xl font-semibold mb-4 text-left">🖼️ Image Analysis</h2>
                <img src={result} alt="Result" className="w-full h-auto rounded border" />
              </div>
            )}

            {/* Report */}
            <div className="w-[40%]">
              {/* For video */}
              {currentFrame && currentFrame.detections.length > 0 && (
                <div className="mt-8 p-6 border rounded-xl shadow-md bg-white text-left w-full">
                  <h3 className="text-xl font-semibold mb-2">📄 Report</h3>
                  {currentFrame.detections.map((det: any, i: number) => {
                    const hazard = hazardDescriptions[det.label];
                    if (!hazard) return null;
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

                  {/* Download Button */}
                  <div className="flex justify-end mt-4">
                    <button onClick={downloadPDF} className="bg-[#fcb900] text-black px-4 py-2 rounded hover:bg-yellow-400 transition font-semibold">
                      📄 Download Report
                    </button>
                  </div>
                </div>
              )}

              {/* For image */}
              {result && hazards.length > 0 && (
                <div className="mt-8 p-6 border rounded-xl shadow-md bg-white text-left w-full">
                  <h3 className="text-xl font-semibold mb-2">📄 Report</h3>
                  {hazards.map((hazard, i) => {
                    const info = hazardDescriptions[hazard];
                    if (!info) return null;
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

                  {/* Download Button */}
                  <div className="flex justify-end mt-4">
                    <button onClick={downloadPDF} className="bg-[#fcb900] text-black px-4 py-2 rounded hover:bg-yellow-400 transition font-semibold">
                      📄 Download Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
