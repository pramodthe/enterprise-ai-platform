import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export const hrQuery = async (question) => {
  const res = await axios.post(`${API_BASE}/v1/hr/query`, { question });
  return res.data;
};

export const analyticsQuery = async (query) => {
  const res = await axios.post(`${API_BASE}/v1/analytics/query`, { query });
  return res.data;
};

export const documentsQuery = async (query, document_id = null) => {
  const res = await axios.post(`${API_BASE}/v1/documents/query`, { query, document_id });
  return res.data;
};

export const agentsQuery = async (query) => {
  const res = await axios.post(`${API_BASE}/v1/agents/query`, { query, agent: 'auto' });

  // Check if response is a JSON string that should be parsed
  // This handles the case where document agent returns structured JSON as a string
  if (res.data && typeof res.data.response === 'string') {
    try {
      // Try to parse the response field as JSON
      const parsedResponse = JSON.parse(res.data.response);
      // If it's the structured format (with answer_markdown, short_answer, etc.), return the parsed object
      if (parsedResponse.answer_markdown || parsedResponse.short_answer || parsedResponse.sources) {
        return {
          ...res.data,
          response: parsedResponse
        };
      }
    } catch (e) {
      // If parsing fails, return original response
      console.log('Response is not JSON, returning as-is:', e);
    }
  }

  return res.data;
};

export const agentsStatus = async () => {
  const res = await axios.get(`${API_BASE}/v1/agents/status`);
  return res.data;
};

export const uploadDocument = async (file, onUploadProgress) => {
  const form = new FormData();
  form.append('file', file);
  const res = await axios.post(`${API_BASE}/v1/documents/upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
  return res.data;
};

export const deleteDocument = async (document_id) => {
  const res = await axios.delete(`${API_BASE}/v1/documents/delete/${document_id}`);
  return res.data;
};

export const listDocuments = async () => {
  const res = await axios.get(`${API_BASE}/v1/documents/list`);
  return res.data;
};