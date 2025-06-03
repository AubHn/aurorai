import { useState } from 'react';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [image, setImage] = useState(null);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://127.0.0.1:8000/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const base64 = res.data.image; // Adjust if your response key is different
      setImage(`data:image/jpeg;base64,${base64}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <input type="file" onChange={handleFileChange} className="mb-4" />
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        onClick={handleSubmit}
      >
        Detect Hazards
      </button>

      {image && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Result:</h2>
          <img src={image} alt="Detection Result" className="rounded shadow" />
        </div>
      )}
    </div>
  );
}

export default App;
