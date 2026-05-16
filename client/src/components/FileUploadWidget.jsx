import { useState } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

function FileUploadWidget({ onFileUploaded, accept = 'image/*,video/*', label = 'Choisir un fichier' }) {
  const { token } = useContext(AuthContext);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3008';

  // Handler pour les images uniquement (avec input file classique)
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!token) {
      setMessage('❌ Token absent : connectez-vous avant de télécharger un fichier.');
      return;
    }

    setUploading(true);
    setMessage('');

    for (const file of files) {
      try {
        const resourceType = 'image';
        const timeoutMs = 300000; // 5min pour images

        // Flow standard pour images
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
        console.log(`🚀 Démarrage upload image ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

        const uploadResult = await uploadToCloudinary(file, signData, timeoutMs, (percent) => {
          setMessage(`⏳ ${file.name} : ${percent}%`);
        });

        const uploadedUrl = uploadResult.secure_url || uploadResult.url || uploadResult.fileUrl;
        if (!uploadedUrl) {
          throw new Error('Aucune URL renvoyée par Cloudinary après l\'upload.');
        }

        onFileUploaded(uploadedUrl);
        setMessage(`✅ ${file.name} uploadé avec succès`);
      } catch (err) {
        console.error(`❌ Erreur image ${file.name}:`, err);
        setMessage(`❌ Erreur: ${err.message}`);
      }
    }

    setUploading(false);
  };

  // Handler pour les vidéos (ouvre directement le widget Cloudinary)
  const handleVideoUpload = async () => {
    if (!token) {
      setMessage('❌ Token absent : connectez-vous avant de télécharger un fichier.');
      return;
    }

    setUploading(true);
    setMessage('⏳ Ouverture du sélecteur vidéo...');

    try {
      // Charger dynamiquement le script du widget si nécessaire
      await new Promise((resolve, reject) => {
        if (window.cloudinary && window.cloudinary.openUploadWidget) return resolve();
        const s = document.createElement('script');
        s.src = 'https://upload-widget.cloudinary.com/latest/global/all.js';
        s.onload = () => resolve();
        s.onerror = (err) => reject(new Error('Impossible de charger le Cloudinary Upload Widget'));
        document.head.appendChild(s);
      });

      // Récupérer cloudName et apiKey depuis le backend
      const infoRes = await fetch(`${backendUrl}/cloudinary/sign?resourceType=video`, { headers: { Authorization: `Bearer ${token}` } });
      if (!infoRes.ok) throw new Error('Impossible d\'obtenir la configuration Cloudinary.');
      const info = await infoRes.json();

      // Ouvrir le widget - l'utilisateur choisit le fichier directement dans le widget
      const widget = window.cloudinary.openUploadWidget(
        {
          cloudName: info.cloudName,
          api_key: info.apiKey,
          folder: 'immotisse-uploads',
          resourceType: 'video',
          multiple: false,
          maxFileSize: 1024 * 1024 * 1024,
          clientAllowedFormats: ['mp4', 'mov', 'mkv', 'webm'],
          // Optimisations pour plus de vitesse
          chunkSize: 10000000, // 10MB chunks
          maxConcurrentRequests: 4, // Upload 4 chunks en parallèle
          retryStrategy: 'exponential', // Retry avec délai exponentiel
          prepareUploadParams: (cb, params) => {
            fetch(`${backendUrl}/cloudinary/sign`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ params })
            })
              .then((r) => r.json())
              .then((data) => {
                const out = Object.assign({}, data.upload_params || {}, { 
                  signature: data.signature, 
                  api_key: data.apiKey
                });
                console.log('✅ Params vidéo prêts:', out);
                cb(out);
              })
              .catch((err) => {
                console.error('Erreur prepareUploadParams:', err);
                cb({ cancel: true });
              });
          }
        },
        (err, result) => {
          if (!err && result && result.event === 'success') {
            const uploadedUrl = result.info.secure_url || result.info.url;
            onFileUploaded(uploadedUrl);
            setMessage(`✅ ${result.info.original_filename} uploadé avec succès`);
          } else if (err) {
            console.error('Widget error:', err);
            setMessage(`❌ Erreur widget: ${err.message || err}`);
          }
          setUploading(false);
        }
      );

      widget.open();
    } catch (err) {
      console.error('❌ Erreur ouverture widget:', err);
      setMessage(`❌ Erreur: ${err.message}`);
      setUploading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        {/* Bouton pour les images */}
        <label className="upload-label">
          <span>📷 Ajouter une image</span>
          <input
            type="file"
            onChange={handleImageUpload}
            disabled={uploading}
            accept="image/*"
            multiple
          />
        </label>

        {/* Bouton pour les vidéos */}
        <button
          onClick={handleVideoUpload}
          disabled={uploading}
          style={{
            padding: '8px 15px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            opacity: uploading ? 0.6 : 1
          }}
        >
          🎬 Ajouter une vidéo
        </button>
      </div>

      {uploading && <span>Upload en cours...</span>}
      {message && <div className="alert" style={{ marginTop: 10 }}>{message}</div>}
    </div>
  );
}

export default FileUploadWidget;
