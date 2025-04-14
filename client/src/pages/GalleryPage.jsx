import { useState, useEffect } from 'react';
import axios from 'axios';

function GalleryPage() {
  const [password, setPassword] = useState('');
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const fetchPhotos = async () => {
    try {
      const response = await axios.get('/api/protected/photos', {
        headers: {
          Authorization: password
        }
      });
      setPhotos(response.data.photos);
      setError('');
      setIsAuthenticated(true);
    } catch (err) {
      setError('Invalid password');
      setPhotos([]);
      setIsAuthenticated(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await fetchPhotos();
    setLoading(false);
  };

  const handlePhotoClick = (filename) => {
    if (isSelectionMode) {
      handlePhotoSelect(filename);
    } else {
      setSelectedPhoto(filename);
    }
  };

  const handlePhotoSelect = (filename) => {
    setSelectedPhotos(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(filename)) {
        newSelection.delete(filename);
      } else {
        newSelection.add(filename);
      }
      return newSelection;
    });
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (!isSelectionMode) {
      setSelectedPhotos(new Set());
    }
  };

  const handleCloseModal = () => {
    setSelectedPhoto(null);
  };

  const handleDeletePhoto = async (filename) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      await axios.delete(`/api/protected/photos/${filename}`, {
        headers: {
          Authorization: password
        }
      });
      setPhotos(photos.filter(photo => photo !== filename));
      if (selectedPhoto === filename) {
        setSelectedPhoto(null);
      }
    } catch (err) {
      setError('Error deleting photo');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedPhotos.size} photos?`)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedPhotos).map(filename =>
        axios.delete(`/api/protected/photos/${filename}`, {
          headers: { Authorization: password }
        })
      );
      await Promise.all(deletePromises);
      setPhotos(photos.filter(photo => !selectedPhotos.has(photo)));
      setSelectedPhotos(new Set());
      if (selectedPhoto && selectedPhotos.has(selectedPhoto)) {
        setSelectedPhoto(null);
      }
    } catch (err) {
      setError('Error deleting photos');
    }
  };

  const handleBulkDownload = async () => {
    try {
      const filenames = Array.from(selectedPhotos);
      const response = await axios.get('/api/protected/photos/zip', {
        params: {
          password,
          filenames: JSON.stringify(filenames)
        },
        responseType: 'blob'
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'selected-photos.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Error downloading photos');
    }
  };

  const handleDownloadAll = async () => {
    try {
      const response = await axios.get('/api/protected/photos/zip', {
        params: { password },
        responseType: 'blob'
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'all-photos.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Error downloading photos');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-900 via-purple-900 to-indigo-900">
      {!isAuthenticated ? (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-rose-300/20 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-rose-500/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
            
            <h1 className="text-5xl font-bold text-center mb-8 text-rose-100 font-serif tracking-wide">
              Dua & Akib's Wedding Photo Gallery
            </h1>
            <form onSubmit={handlePasswordSubmit} className="space-y-8">
              <div>
                <label className="block text-xl font-medium text-rose-100 mb-3">
                  Enter Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-white/10 border border-rose-300/30 rounded-2xl text-rose-100 placeholder-rose-300/50 focus:ring-2 focus:ring-rose-500 focus:border-transparent text-lg"
                  placeholder="Enter the password"
                />
              </div>
              {error && (
                <div className="p-5 bg-rose-500/20 text-rose-100 rounded-2xl border border-rose-500/30 backdrop-blur-sm">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-5 px-8 rounded-full font-semibold text-white transition-all duration-300 transform hover:scale-105 text-lg ${
                  loading
                    ? 'bg-rose-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700'
                }`}
              >
                {loading ? 'Loading...' : 'View Gallery'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-6xl font-bold text-rose-100 mb-6 font-serif tracking-wide">
              Dua & Akib's Wedding Photo Gallery
              </h1>
              <p className="text-2xl text-rose-200/90 font-light italic">
                The special day
              </p>
            </div>

            <div className="flex justify-between items-center mb-8">
              <div className="flex gap-4">
                <button
                  onClick={toggleSelectionMode}
                  className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                    isSelectionMode
                      ? 'bg-rose-500 text-white hover:bg-rose-600'
                      : 'bg-white/10 text-rose-100 hover:bg-white/20 border border-rose-300/20'
                  }`}
                >
                  {isSelectionMode ? 'Exit Selection Mode' : 'Select Photos'}
                </button>
                {selectedPhotos.size > 0 && (
                  <>
                    <button
                      onClick={handleBulkDownload}
                      className="px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-full hover:from-rose-600 hover:to-purple-700 transition-colors"
                    >
                      Download Selected ({selectedPhotos.size})
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="px-6 py-3 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors"
                    >
                      Delete Selected ({selectedPhotos.size})
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={handleDownloadAll}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full hover:from-purple-600 hover:to-indigo-700 transition-colors"
              >
                Download All Photos
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {photos.map((filename) => (
                <div
                  key={filename}
                  className={`relative group aspect-square bg-white/5 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden border-2 ${
                    selectedPhotos.has(filename)
                      ? 'border-rose-500 scale-105'
                      : 'border-rose-300/20'
                  } transform transition-all duration-300 hover:scale-105 hover:border-rose-300/40 cursor-pointer`}
                  onClick={() => handlePhotoClick(filename)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-black/0 to-black/0 group-hover:from-black/20 group-hover:to-black/40 transition-all duration-300" />
                  <img
                    src={`/api/uploads/${filename}`}
                    alt="Wedding photo"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  {isSelectionMode && (
                    <div className={`absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      selectedPhotos.has(filename)
                        ? 'bg-rose-500 text-white'
                        : 'bg-white/20 text-white/50 group-hover:bg-white/30'
                    }`}>
                      {selectedPhotos.has(filename) ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(filename);
                    }}
                    className="absolute top-4 right-4 bg-rose-500 text-white rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-rose-600 shadow-lg transform hover:scale-110"
                    title="Delete photo"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {photos.length === 0 && (
              <div className="text-center py-16">
                <p className="text-2xl text-rose-200/90 font-light">No photos uploaded yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedPhoto && !isSelectionMode && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-auto border border-rose-300/20 relative">
            <div className="p-8 flex justify-between items-center border-b border-rose-300/20">
              <h2 className="text-3xl font-serif text-rose-100 tracking-wide">Photo Preview</h2>
              <button
                onClick={handleCloseModal}
                className="text-rose-300 hover:text-rose-100 transition-colors transform hover:scale-110"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-8">
              <img
                src={`/api/uploads/${selectedPhoto}`}
                alt="Full size wedding photo"
                className="max-w-full h-auto mx-auto rounded-2xl shadow-2xl"
              />
            </div>
            <div className="p-8 border-t border-rose-300/20 flex justify-between items-center">
              <button
                onClick={() => handleDeletePhoto(selectedPhoto)}
                className="px-8 py-4 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors shadow-lg text-lg"
              >
                Delete Photo
              </button>
              <a
                href={`/api/uploads/${selectedPhoto}`}
                download
                className="px-8 py-4 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-full hover:from-rose-600 hover:to-purple-700 transition-colors shadow-lg text-lg"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GalleryPage; 