import { useState, useRef } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function MultiFileUpload({ onFilesUploaded, accept = 'image/*,video/*', maxFiles = 10, label = 'Sélectionner des fichiers' }) {
  const { token } = useContext(AuthContext);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (!token) {
      alert('Token manquant : connectez-vous avant de télécharger un fichier.');
      return;
    }

    const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB max

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        alert('Un ou plusieurs fichiers dépassent la taille maximale autorisée de 1GB.');
        return;
      }
    }

    if (files.length > maxFiles) {
      alert(`Maximum ${maxFiles} fichiers autorisés`);
      return;
    }

    setUploading(true);
    const newProgress = {};
    const newUploadedFiles = [];
    setMessage('');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      newProgress[file.name] = 0;

      try {
        const signResponse = await fetch('https://immotisse.onrender.com/cloudinary/sign', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!signResponse.ok) {
          const errorData = await signResponse.json();
          throw new Error(errorData.message || 'Impossible de signer le fichier');
        }

        const signData = await signResponse.json();
        const uploadUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName}/auto/upload`;
        const formData = new FormData();
        formData.append('file', file);
        if (signData.unsigned) {
          formData.append('upload_preset', signData.uploadPreset);
        } else {
          formData.append('api_key', signData.apiKey);
          formData.append('timestamp', signData.timestamp);
          formData.append('signature', signData.signature);
        }
        formData.append('folder', signData.folder);
        formData.append('resource_type', signData.resourceType);

        // Créer une promesse qui reject après 10 minutes (600000ms)
        const uploadPromise = fetch(uploadUrl, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
          }
        });

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: Upload a dépassé 10 minutes')), 600000)
        );

        const response = await Promise.race([uploadPromise, timeoutPromise]);

        if (response.ok) {
          const data = await response.json();
          newUploadedFiles.push(data.secure_url || data.url || data.fileUrl);
          newProgress[file.name] = 100;
        } else {
          const err = await response.json();
          const errorMsg = err.error?.message || err.message || `Erreur upload (${response.status})`;
          console.error(`Erreur upload ${file.name}:`, err);
          setMessage(`❌ ${file.name}: ${errorMsg}`);
          newProgress[file.name] = -1; // Erreur
        }
      } catch (error) {
        console.error(`Erreur upload ${file.name}:`, error);
        setMessage(`❌ Erreur réseau: ${error.message}`);
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

      {message && <div className="alert" style={{ marginTop: 10 }}>{message}</div>}

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
