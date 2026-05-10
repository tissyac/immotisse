import { useState } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function FileUploadWidget({ onFileUploaded, accept = 'image/*,video/*', label = 'Choisir un fichier' }) {
  const { token } = useContext(AuthContext);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!token) {
      setMessage('❌ Token absent : connectez-vous avant de télécharger un fichier.');
      return;
    }

    const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB max

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setMessage('❌ Fichier trop volumineux. Taille maximale autorisée : 1GB.');
        return;
      }
    }

    setUploading(true);
    setMessage('');

    for (const file of files) {
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

        const uploadPromise = fetch(uploadUrl, {
          method: 'POST',
          body: formData
        });

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: Upload a dépassé 10 minutes')), 600000)
        );

        const res = await Promise.race([uploadPromise, timeoutPromise]);
        const data = await res.json();

        if (res.ok) {
          onFileUploaded(data.secure_url || data.url || data.fileUrl);
          setMessage(`✅ ${file.name} uploadé avec succès`);
        } else {
          const errorMsg = data.error?.message || data.message || `Erreur Cloudinary (${res.status})`;
          console.error('Erreur upload Cloudinary:', data);
          setMessage(`❌ Erreur: ${errorMsg}`);
        }
      } catch (err) {
        console.error('Erreur upload:', err);
        setMessage(`❌ Erreur réseau: ${err.message}`);
      }
    }

    setUploading(false);
  };

  return (
    <div>
      <label className="upload-label">
        <span>{label}</span>
        <input
          type="file"
          onChange={handleUpload}
          disabled={uploading}
          accept={accept}
          multiple
        />
      </label>
      {uploading && <span>Upload en cours...</span>}
      {message && <div className="alert" style={{ marginTop: 10 }}>{message}</div>}
    </div>
  );
}

export default FileUploadWidget;
