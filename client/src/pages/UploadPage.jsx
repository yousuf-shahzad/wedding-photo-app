import { useState, useCallback } from 'react';
import axios from 'axios';

function UploadPage() {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        setError('Some files exceed 10MB limit');
        return false;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setError('Only JPEG and PNG files are allowed');
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setError('');
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;

    setUploading(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`photos[${index}]`, file);
    });

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({
            ...prev,
            [files.length - 1]: progress
          }));
        }
      });

      setMessage('Photos uploaded successfully!');
      setFiles([]);
      setUploadProgress({});
    } catch (err) {
      console.error('Upload error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Error uploading photos');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        setError('Some files exceed 10MB limit');
        return false;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setError('Only JPEG and PNG files are allowed');
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setError('');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-900 via-purple-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8">
      <a 
        href="/gallery" 
        className="fixed top-4 right-4 px-4 py-2 text-rose-200/80 hover:text-rose-100 text-sm transition-colors duration-300 z-10"
      >
        Gallery Access
      </a>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-rose-100 mb-4 font-serif tracking-wide">
            Dua & Akib: Share Your Wedding Memories
          </h1>
          <p className="text-2xl text-rose-200/90 font-light italic">
            Capture the magic of our special day together
          </p>
        </div>

        <div 
          className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-8 border border-rose-300/20 relative overflow-hidden"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Decorative elements */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-rose-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
          
          <div className="border-2 border-dashed border-rose-300/30 rounded-2xl p-12 text-center relative">
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 mb-8 relative">
                <div className="absolute inset-0 bg-rose-500 rounded-full opacity-20 animate-pulse"></div>
                <svg className="w-full h-full text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-2xl text-rose-100 mb-8 font-light">
                Drag and drop your photos here, or
              </p>
              <label className="cursor-pointer bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-lg">
                Select Photos
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png"
                  multiple
                  onChange={handleFileChange}
                />
              </label>
              <p className="mt-6 text-sm text-rose-200/80">
                JPEG or PNG, max 10MB per file
              </p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-12">
              <h2 className="text-3xl font-serif text-rose-100 mb-8 text-center">Selected Photos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {files.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square overflow-hidden rounded-2xl border-2 border-rose-300/20 transform transition-all duration-300 group-hover:scale-105 group-hover:border-rose-300/40">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-3 right-3 bg-rose-500 text-white rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-rose-600 shadow-lg transform hover:scale-110"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    {uploadProgress[index] !== undefined && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm text-white p-3">
                        <div className="h-1.5 bg-gradient-to-r from-rose-500 to-purple-600 rounded-full" 
                          style={{ width: `${uploadProgress[index]}%` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-8 p-5 bg-rose-500/20 text-rose-100 rounded-2xl border border-rose-500/30 backdrop-blur-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-8 p-5 bg-emerald-500/20 text-emerald-100 rounded-2xl border border-emerald-500/30 backdrop-blur-sm">
              {message}
            </div>
          )}

          {files.length > 0 && (
            <button
              onClick={handleSubmit}
              disabled={uploading}
              className={`mt-10 w-full py-5 px-8 rounded-full font-semibold text-white transition-all duration-300 transform hover:scale-105 text-lg ${
                uploading
                  ? 'bg-rose-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700'
              }`}
            >
              {uploading ? 'Uploading...' : `Upload ${files.length} Photo${files.length > 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadPage; 