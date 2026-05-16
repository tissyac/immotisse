import { useState } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

function FileUploadWidget({ onFileUploaded, accept = 'image/*,video/*', label = 'Choisir un fichier' }) {
  const { token } = useContext(AuthContext);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3008';

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
      const isVideo = file.type.startsWith('video/');
      try {
        const resourceType = isVideo ? 'video' : 'image';
        const timeoutMs = isVideo ? 600000 : 300000; // 10min pour vidéos, 5min pour autres

        // Pour les vidéos volumineuses, utiliser le Cloudinary Upload Widget (signed)
        if (isVideo) {
          // Demander confirmation car le widget ouvrira un sélecteur séparé
          const proceed = window.confirm('Les vidéos volumineuses sont téléchargées via le widget Cloudinary. Continuer ?');
          if (!proceed) {
            setMessage('Upload vidéo annulé par l\'utilisateur.');
            continue;
          }

          // Charger dynamiquement le script du widget si nécessaire
          await new Promise((resolve, reject) => {
            if (window.cloudinary && window.cloudinary.openUploadWidget) return resolve();
            const s = document.createElement('script');
            s.src = 'https://upload-widget.cloudinary.com/latest/global/all.js';
            s.onload = () => resolve();
            s.onerror = (err) => reject(new Error('Impossible de charger le Cloudinary Upload Widget'));
            document.head.appendChild(s);
          });

          // Récupérer cloudName et apiKey depuis le backend (GET sign retourne apiKey/cloudName)
          const infoRes = await fetch(`${backendUrl}/cloudinary/sign?resourceType=video`, { headers: { Authorization: `Bearer ${token}` } });
          if (!infoRes.ok) throw new Error('Impossible d\'obtenir la configuration Cloudinary.');
          const info = await infoRes.json();

          // Ouvrir le widget en mode signed en utilisant prepareUploadParams
          const widget = window.cloudinary.openUploadWidget(
            {
              cloudName: info.cloudName,
              api_key: info.apiKey,
              folder: 'immotisse-uploads',
              resourceType: 'video',
              multiple: false,
              // Allow uploads up to 1GB
              maxFileSize: 1024 * 1024 * 1024,
              clientAllowedFormats: ['mp4', 'mov', 'mkv', 'webm'],
              prepareUploadParams: (cb, params) => {
                // Ne pas modifier les params du widget — signer tels quels
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
                    // Les upload_params contiennent les paramètres signés + max_file_size (non signé)
                    const out = Object.assign({}, data.upload_params || {}, { 
                      signature: data.signature, 
                      api_key: data.apiKey
                    });
                    console.log('✅ Params prêts pour upload:', out);
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
                setMessage(`✅ ${result.info.original_filename || file.name} uploadé avec succès`);
              } else if (err) {
                console.error('Widget error:', err);
                setMessage(`❌ Erreur widget: ${err.message || err}`);
              }
            }
          );

          widget.open();
          // attente asynchrone : widget gère le reste, continuer vers le prochain fichier
          continue;
        }

        // Flow standard pour images et petits fichiers
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
          setMessage(`⏳ ${file.name} : ${percent}%`);
        });

        const uploadedUrl = uploadResult.secure_url || uploadResult.url || uploadResult.fileUrl;
        if (!uploadedUrl) {
          throw new Error('Aucune URL renvoyée par Cloudinary après l\'upload.');
        }

        onFileUploaded(uploadedUrl);
        setMessage(`✅ ${file.name} uploadé avec succès`);
        console.log(`✅ Upload successful for ${file.name}`);
      } catch (err) {
        console.error(`❌ Erreur réseau pour ${file.name}:`, err);
        
        // Message d'erreur spécifique selon le type d'erreur
        if (err.message.includes('Failed to fetch')) {
          if (isVideo) {
            setMessage(`❌ Erreur réseau pour ${file.name}: Vérifiez votre connexion internet. Les vidéos volumineuses peuvent prendre du temps.`);
          } else {
            setMessage(`❌ Erreur réseau: Impossible de contacter Cloudinary. Vérifiez votre connexion internet.`);
          }
        } else if (err.message.includes('Timeout')) {
          setMessage(`❌ Timeout: ${file.name} est trop volumineux ou votre connexion est lente. Essayez avec un fichier plus petit.`);
        } else {
          setMessage(`❌ Erreur réseau: ${err.message}`);
        }
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
