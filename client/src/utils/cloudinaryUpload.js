export async function uploadToCloudinary(file, signData, timeoutMs, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    const resourcePath = signData.resourceType === 'video' ? 'video' : signData.resourceType === 'image' ? 'image' : 'auto';
    const uploadUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName}/${resourcePath}/upload`;
    
    console.log('🚀 uploadToCloudinary démarrage:', {
      fileName: file.name,
      fileSize: (file.size / 1024 / 1024).toFixed(2) + 'MB',
      resourcePath,
      uploadUrl: uploadUrl.replace(signData.cloudName, '[CLOUD_NAME]'),
      timeoutMs,
      timeoutSeconds: timeoutMs / 1000
    });
    
    const formData = new FormData();

    formData.append('file', file);
    formData.append('api_key', signData.apiKey);
    formData.append('timestamp', signData.timestamp);
    formData.append('signature', signData.signature);
    formData.append('folder', signData.folder);
    // NOTE: resource_type est dans l'URL, pas dans le formulaire!

    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl, true);
    xhr.timeout = timeoutMs;
    xhr.responseType = 'json';

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      const response = xhr.response;
      if (xhr.status >= 200 && xhr.status < 300) {
        return resolve(response);
      }

      let errorMessage = `Cloudinary upload failed with status ${xhr.status}`;
      if (response && typeof response === 'object') {
        errorMessage = response.error?.message || response.message || errorMessage;
      } else if (xhr.responseText) {
        try {
          const parsed = JSON.parse(xhr.responseText);
          errorMessage = parsed.error?.message || parsed.message || errorMessage;
        } catch (parseError) {
          console.warn('Unable to parse Cloudinary error response:', parseError);
        }
      }

      reject(new Error(errorMessage));
    };

    xhr.onerror = () => {
      console.error('❌ XHR onerror triggered - vérifiez la connexion réseau ou CORS');
      reject(new Error("Erreur réseau pendant l'upload vers Cloudinary.")); 
    };

    xhr.ontimeout = () => {
      console.warn('⏱️ XHR timeout après', timeoutMs / 1000, 'secondes');
      reject(new Error(`Timeout: Upload a dépassé ${timeoutMs / 1000} secondes`));
    };

    xhr.send(formData);
  });
}
