import React, { useState } from 'react';
import {
  Typography,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress
} from '@mui/material';
import { Description, UploadFile } from '@mui/icons-material';
import { documentsQuery, uploadDocument } from '../services/api';

const DocumentSearch = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleQuerySubmit = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      const response = await documentsQuery(query);
      setResult(response.answer);
      setSources(response.source_documents);
    } catch (err) {
      setError('Error communicating with Document agent. Please try again.');
      console.error('Document Agent Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await uploadDocument(file);
      alert(`Document uploaded successfully: ${response.message}`);
    } catch (err) {
      setError('Error uploading document. Please try again.');
      console.error('Document Upload Error:', err);
    } finally {
      setUploading(false);
    }
  };

  const exampleQueries = [
    "What is our company's vacation policy?",
    "Find information about expense reports",
    "What are the security protocols?",
    "Search for the employee handbook"
  ];

  const handleExampleClick = (example) => {
    setQuery(example);
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Document Intelligence
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Search and retrieve information from company documents
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Search Documents
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              placeholder="Ask about company policies, procedures, or document content..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="contained"
                onClick={handleQuerySubmit}
                disabled={loading || !query.trim()}
              >
                {loading ? 'Searching...' : 'Search Documents'}
              </Button>
            </Box>
          </Paper>

          {uploading && (
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Uploading Document...
              </Typography>
              <LinearProgress />
            </Paper>
          )}

          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload New Documents
            </Typography>
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadFile />}
            >
              Upload Document
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx,.txt,.md"
                onChange={handleFileUpload}
              />
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Supported formats: PDF, DOC, DOCX, TXT, MD
            </Typography>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {result && (
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Document Search Result:
              </Typography>
              <Typography variant="body1" paragraph>
                {result}
              </Typography>
              
              {sources.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Source Documents:
                  </Typography>
                  <List>
                    {sources.map((source, index) => (
                      <ListItem key={index} dense>
                        <ListItemIcon>
                          <Description fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={source} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Example Queries
              </Typography>
              {exampleQueries.map((example, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={() => handleExampleClick(example)}
                    sx={{ justifyContent: 'flex-start', mb: 1 }}
                  >
                    {example}
                  </Button>
                </Box>
              ))}
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Tips for Better Results
                </Typography>
                <ul>
                  <li>Be specific with your questions</li>
                  <li>Include document names if known</li>
                  <li>Ask for summaries of long documents</li>
                  <li>Request comparisons between policies</li>
                </ul>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default DocumentSearch;