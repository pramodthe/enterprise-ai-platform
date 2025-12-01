
import React, { useState } from 'react';
import {
    uploadToSupabase,
    getSignedDownloadUrl,
    downloadFileBytes,
    sendToBackendForIndexing
} from '../lib/documentService';

const DocumentUploader = () => {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, uploading, processing, success, error
    const [message, setMessage] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setStatus('idle');
            setMessage('');
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage('Please select a file first.');
            return;
        }

        try {
            setStatus('uploading');
            setMessage('Uploading to Supabase...');

            // 1. Upload to Supabase
            const filePath = await uploadToSupabase(file);

            setStatus('processing');
            setMessage('Getting signed URL...');

            // 2. Get Signed URL
            const signedUrl = await getSignedDownloadUrl(filePath);

            setMessage('Downloading file bytes...');

            // 3. Download bytes
            const fileBytes = await downloadFileBytes(signedUrl);

            setMessage('Sending to backend for indexing...');

            // 4. Send to Backend
            await sendToBackendForIndexing(fileBytes, file.name);

            setStatus('success');
            setMessage('File uploaded and indexed successfully!');
            setFile(null);
            // Reset file input if needed, but uncontrolled input is tricky to reset without ref
            document.getElementById('file-upload').value = '';

        } catch (error) {
            console.error('Upload flow failed:', error);
            setStatus('error');
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto mt-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Document Upload</h2>

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="file-upload">
                    Select Document
                </label>
                <input
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
                    accept=".pdf,.doc,.docx,.txt,.md"
                />
            </div>

            <button
                onClick={handleUpload}
                disabled={!file || status === 'uploading' || status === 'processing'}
                className={`w-full font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out
          ${(!file || status === 'uploading' || status === 'processing')
                        ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
                {status === 'uploading' ? 'Uploading...' :
                    status === 'processing' ? 'Processing...' :
                        'Upload & Index'}
            </button>

            {message && (
                <div className={`mt-4 p-3 rounded text-sm ${status === 'error' ? 'bg-red-100 text-red-700' :
                        status === 'success' ? 'bg-green-100 text-green-700' :
                            'bg-blue-100 text-blue-700'
                    }`}>
                    {message}
                </div>
            )}
        </div>
    );
};

export default DocumentUploader;
