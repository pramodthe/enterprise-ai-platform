
import { supabase } from './supabaseClient';

const BACKEND_API_URL = '/api/v1'; // Using proxy defined in vite.config.js

/**
 * Uploads a file to Supabase Storage.
 * @param {File} file 
 * @returns {Promise<string>} The path of the uploaded file in storage.
 */
// uploadToSupabase removed - upload is now handled by backend


/**
 * Lists files in the documents bucket.
 * @returns {Promise<Array>} List of files.
 */

export const listDocuments = async () => {
    try {
        const response = await fetch(`${BACKEND_API_URL}/documents/list`);
        if (!response.ok) {
            throw new Error(`Failed to list documents: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error listing documents:", error);
        return [];
    }
};

/**
 * Gets a signed download URL for a file in Supabase Storage.
 * @param {string} filePath 
 * @returns {Promise<string>} The signed URL.
 */
export const getSignedDownloadUrl = async (filePath) => {
    const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 60); // Valid for 60 seconds

    if (error) {
        throw new Error(`Failed to get signed URL: ${error.message}`);
    }

    return data.signedUrl;
};

/**
 * Downloads a file from a URL as a Uint8Array.
 * @param {string} url 
 * @returns {Promise<Uint8Array>} The file content as bytes.
 */
export const downloadFileBytes = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
    }
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
};

/**
 * Sends file bytes to the backend for indexing.
 * @param {Uint8Array} bytes 
 * @param {string} filename 
 * @returns {Promise<any>} The backend response.
 */
export const sendToBackendForIndexing = async (bytes, filename) => {
    const formData = new FormData();
    const blob = new Blob([bytes]);
    formData.append('file', blob, filename);

    const response = await fetch(`${BACKEND_API_URL}/documents/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend indexing failed: ${errorText}`);
    }

    return response.json();
};

/**
 * Queries the backend for documents.
 * @param {string} queryString 
 * @returns {Promise<any>} The query results.
 */
export const queryDocuments = async (queryString) => {
    const response = await fetch(`${BACKEND_API_URL}/documents/query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: queryString }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Query failed: ${errorText}`);
    }

    return response.json();
};

/**
 * Deletes a document.
 * @param {string} docId 
 * @returns {Promise<any>}
 */
export const deleteDocument = async (docId) => {
    const response = await fetch(`${BACKEND_API_URL}/documents/delete/${docId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Delete failed: ${errorText}`);
    }

    return response.json();
};
