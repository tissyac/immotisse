import { useState } from 'react';

function DocumentUploadWidget({ 
  label = 'Télécharger un document',
  documentType = 'document',
  onFileUploaded = () => {},
  value = ''
}) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    console.log('🔍 Upload tentative:', {
      nom: file.name,
      type: file.type,
      taille: file.size
    });

    // Vérifier le type MIME
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      const msg = `❌ Format non accepté. Acceptés: PDF, JPG, PNG, GIF, WebP. Type: ${file.type || 'inconnu'}`;
      setMessage(msg);
      setError(msg);
      console.error(msg);
      return;
    }
    
    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      const msg = '❌ Le fichier est trop volumineux (max 10MB)';
      setMessage(msg);
      setError(msg);
      console.error(msg);
      return;
    }

    setUploading(true);
    setMessage('');
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('📤 Envoi à: http://localhost:3008/upload/uploadPublic');
      
      const res = await fetch('http://localhost:3008/upload/uploadPublic', {
        method: 'POST',
        body: formData
      });

      console.log('📊 Réponse status:', res.status);
      console.log('📊 Content-Type:', res.headers.get('content-type'));

      const contentType = res.headers.get('content-type');
      const responseText = await res.text();
      
      console.log('📝 Contenu brut:', responseText.substring(0, 200));

      // Vérifier si c'est du JSON
      if (contentType && contentType.includes('application/json')) {
        try {
          const data = JSON.parse(responseText);
          console.log('✅ JSON parsé:', data);

          if (res.ok) {
            onFileUploaded(data.fileUrl);
            setFileName(file.name);
            setMessage(`✅ ${file.name} uploadé avec succès`);
          } else {
            const errorMsg = data.message || 'Erreur lors de l\'upload';
            setMessage(`❌ ${errorMsg}`);
            setError(errorMsg);
            console.error('Upload error:', data);
          }
        } catch (parseError) {
          console.error('❌ Erreur JSON parse:', parseError);
          setMessage(`❌ Erreur: ${parseError.message}`);
          setError(`Parse error: ${responseText}`);
        }
      } else {
        // Erreur 500 - HTML returned instead of JSON
        console.error('❌ HTML reçu au lieu de JSON:', responseText.substring(0, 500));
        setMessage(`❌ Erreur serveur (${res.status}). Vérifiez les logs du serveur.`);
        setError(`HTML error: ${res.status}\n${responseText.substring(0, 300)}`);
      }
    } catch (err) {
      console.error('❌ Exception réseau:', err);
      setMessage(`❌ Erreur réseau: ${err.message}`);
      setError(err.stack || err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="document-upload-widget">
      <label className="upload-label">
        <span className="upload-icon">📄</span>
        <span className="upload-text">{label}</span>
        <input
          type="file"
          onChange={handleUpload}
          disabled={uploading}
          accept=".pdf,image/jpeg,image/png,image/gif,image/webp"
          className="file-input"
        />
      </label>

      {fileName && (
        <div className="file-info">
          ✓ Fichier: {fileName}
        </div>
      )}

      {uploading && (
        <div className="uploading">
          ⏳ Upload en cours...
        </div>
      )}

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {error && (
        <details style={{ marginTop: '10px', padding: '10px', background: '#fee2e2', borderRadius: '4px', fontSize: '0.8rem', color: '#666' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>🔍 Détails erreur (cliquez)</summary>
          <pre style={{ marginTop: '10px', overflow: 'auto', maxHeight: '150px' }}>{error}</pre>
        </details>
      )}

      {value && !fileName && (
        <div className="file-info">
          ✓ Document uploadé: {value.split('/').pop()}
        </div>
      )}
    </div>
  );
}

export default DocumentUploadWidget;
