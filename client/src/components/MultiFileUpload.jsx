import { useState, useRef } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

function MultiFileUpload({ onFilesUploaded, accept = 'image/*,video/*', maxFiles = 10, label = 'Sélectionner des fichiers' }) {
  const { token } = useContext(AuthContext);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3008';

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
        const isVideo = file.type.startsWith('video/');
        const resourceType = isVideo ? 'video' : 'image';
        const timeoutMs = isVideo ? 600000 : 300000; // 10min pour vidéos, 5min pour autres

        const signResponse = await fetch(`${backendUrl}/cloudinary/sign?resourceType=${resourceType}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const signText = await signResponse.text();
        if (!signResponse.ok) {
          let errorData;
          try {
            errorData = JSON.parse(signText);
          } catch {
            errorData = { message: signText };
          }
          throw new Error(errorData.message || 'Impossible de signer le fichier');
        }

        let signData;
        try {
          signData = JSON.parse(signText);
        } catch (parseError) {
          throw new Error(`Réponse de signature invalide : ${signText}`);
        }
        console.log(`🚀 Démarrage upload pour ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) - Timeout: ${timeoutMs / 1000}s`);

        const uploadResult = await uploadToCloudinary(file, signData, timeoutMs, (percent) => {
          newProgress[file.name] = percent;
          setProgress({ ...newProgress });
        });

        const uploadedUrl = uploadResult.secure_url || uploadResult.url || uploadResult.fileUrl;
        if (!uploadedUrl) {
          throw new Error('Aucune URL renvoyée par Cloudinary après l\'upload.');
        }

        newUploadedFiles.push(uploadedUrl);
        newProgress[file.name] = 100;
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
