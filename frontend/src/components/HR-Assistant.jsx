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
  Alert
} from '@mui/material';
import { hrQuery } from '../services/api';

const HRAssistant = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleQuerySubmit = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      const result = await hrQuery(query);
      setResponse(result.answer);
    } catch (err) {
      setError('Error communicating with HR agent. Please try again.');
      console.error('HR Agent Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exampleQueries = [
    "Find employees with Python skills",
    "Show organizational chart for Engineering department",
    "List employees with AWS certification",
    "Who are the team leads in Marketing?"
  ];

  const handleExampleClick = (example) => {
    setQuery(example);
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        HR Assistant
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Employee lookup, skill matching, and organizational insights
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              placeholder="Ask about employees, skills, or organizational structure..."
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
                {loading ? 'Processing...' : 'Ask HR Agent'}
              </Button>
            </Box>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {response && (
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                HR Agent Response:
              </Typography>
              <Typography variant="body1">
                {response}
              </Typography>
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
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default HRAssistant;