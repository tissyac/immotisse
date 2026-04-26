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

    setUploading(true);
    setMessage('');

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('http://localhost:3008/upload/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          onFileUploaded(data.fileUrl);
          setMessage(`✅ ${file.name} uploadé avec succès`);
        } else {
          setMessage(`❌ Erreur lors de l'upload de ${file.name}`);
        }
      } catch (err) {
        setMessage(`❌ ${err.message}`);
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
