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

// Helper to sanitize JSON string with unescaped newlines
function sanitizeJsonString(text) {
  let result = '';
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (char === '"' && !escape) {
        inString = false;
        result += char;
      } else if (char === '\\' && !escape) {
        escape = true;
        result += char;
      } else if (char === '\n') {
        result += '\\n';
        escape = false;
      } else if (char === '\r') {
        // Skip CR
      } else if (char === '\t') {
        result += '\\t';
        escape = false;
      } else {
        result += char;
        if (escape) escape = false;
      }
    } else {
      if (char === '"') {
        inString = true;
        result += char;
      } else {
        result += char;
      }
    }
  }
  return result;
}

export const agentsQuery = async (query) => {
  const res = await axios.post(`${API_BASE}/v1/agents/query`, { query, agent: 'auto' });

  // Check if response is a JSON string that should be parsed
  // This handles the case where document agent returns structured JSON as a string
  if (res.data && typeof res.data.response === 'string') {
    try {
      // Try to parse the response field as JSON
      let textToParse = res.data.response;

      // Try to extract JSON from code blocks if present
      const codeBlockMatch = textToParse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        textToParse = codeBlockMatch[1];
      } else {
        // If no code block, try to find the first [ or {
        const firstBracket = textToParse.indexOf('[');
        const firstBrace = textToParse.indexOf('{');
        const startIdx = (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace))
          ? firstBracket
          : firstBrace;

        if (startIdx !== -1) {
          textToParse = textToParse.substring(startIdx);
          // Determine if we are looking for an array or object based on the start char
          const isArray = textToParse.trim().startsWith('[');
          const lastIdx = isArray
            ? textToParse.lastIndexOf(']')
            : textToParse.lastIndexOf('}');

          if (lastIdx !== -1) {
            textToParse = textToParse.substring(0, lastIdx + 1);
          }
        }
      }

      // Sanitize text before parsing to handle unescaped newlines
      const sanitizedText = sanitizeJsonString(textToParse);
      let parsedResponse = JSON.parse(sanitizedText);

      // Handle array wrapper if present
      if (Array.isArray(parsedResponse) && parsedResponse.length > 0) {
        parsedResponse = parsedResponse[0];
      }

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