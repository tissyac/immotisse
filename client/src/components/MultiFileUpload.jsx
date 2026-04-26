import { useState, useRef } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function MultiFileUpload({ onFilesUploaded, accept = 'image/*,video/*', maxFiles = 10, label = 'Sélectionner des fichiers' }) {
  const { token } = useContext(AuthContext);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (files.length > maxFiles) {
      alert(`Maximum ${maxFiles} fichiers autorisés`);
      return;
    }

    setUploading(true);
    const newProgress = {};
    const newUploadedFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      newProgress[file.name] = 0;

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('http://localhost:3008/upload/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          newUploadedFiles.push(data.fileUrl);
          newProgress[file.name] = 100;
        } else {
          console.error(`Erreur upload ${file.name}:`, response.statusText);
          newProgress[file.name] = -1; // Erreur
        }
      } catch (error) {
        console.error(`Erreur upload ${file.name}:`, error);
        newProgress[file.name] = -1; // Erreur
      }
    }

    setProgress(newProgress);
    setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
    setUploading(false);

    // Notifier le parent
    onFilesUploaded(newUploadedFiles);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    onFilesUploaded(newFiles);
  };

  const getFileType = (url) => {
    const extension = url.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'image';
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension)) return 'video';
    return 'file';
  };

  const renderFilePreview = (url, index) => {
    const type = getFileType(url);

    if (type === 'image') {
      return (
        <div key={index} className="file-preview-item">
          <img src={url} alt={`Fichier ${index + 1}`} />
          <button type="button" onClick={() => removeFile(index)} className="remove-file">×</button>
        </div>
      );
    } else if (type === 'video') {
      return (
        <div key={index} className="file-preview-item">
          <video controls>
            <source src={url} type="video/mp4" />
          </video>
          <button type="button" onClick={() => removeFile(index)} className="remove-file">×</button>
        </div>
      );
    } else {
      return (
        <div key={index} className="file-preview-item file-item">
          <div className="file-icon">📄</div>
          <div className="file-name">{url.split('/').pop()}</div>
          <button type="button" onClick={() => removeFile(index)} className="remove-file">×</button>
        </div>
      );
    }
  };

  return (
    <div className="multi-file-upload">
      <label className="upload-label">
        <span>{label}</span>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept={accept}
          multiple
          disabled={uploading}
        />
      </label>

      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Object.values(progress).reduce((a, b) => a + b, 0) / Object.keys(progress).length}%` }}></div>
          </div>
          <span>Upload en cours...</span>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="file-previews">
          {uploadedFiles.map((url, index) => renderFilePreview(url, index))}
        </div>
      )}

      <div className="upload-info">
        <small>Formats acceptés: Images (JPG, PNG, GIF, WebP) et Vidéos (MP4, MOV, AVI, MKV, WebM)</small>
        <small>Maximum {maxFiles} fichiers</small>
      </div>
    </div>
  );
}

export default MultiFileUpload;