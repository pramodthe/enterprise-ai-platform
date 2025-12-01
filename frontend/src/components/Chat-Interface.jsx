import React, { useState, useRef, useEffect } from 'react';
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
  Divider,
  Avatar,
  IconButton,
  Chip
} from '@mui/material';
import {
  Send,
  SmartToy,
  Person,
  QuestionAnswer
} from '@mui/icons-material';
import RagResponseCard from './RagResponseCard';
import { agentsQuery } from '../services/api';

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your Enterprise AI Assistant. How can I help you today?",
      sender: 'agent',
      agent: 'Unified Assistant',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // Add user message to chat
    const userMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
      agent: 'You',
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    const textToSend = inputText;
    setInputText('');
    setLoading(true);
    setError('');

    try {
      const response = await agentsQuery(textToSend);
      const agentResponse = {
        id: messages.length + 2,
        text: response.response,
        sender: 'agent',
        agent: response.agent_used,
        timestamp: new Date().toLocaleTimeString(),
        confidence: response.confidence
      };

      setMessages(prev => [...prev, agentResponse]);
    } catch (err) {
      console.error('Chat Error Details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        fullError: err
      });
      
      let errorText = "I'm having trouble connecting to the assistant. Please try again later.";
      
      if (err.response) {
        // Server responded with error
        errorText = `Server error: ${err.response.data.detail || err.response.statusText}`;
        setError(`Error ${err.response.status}: ${err.response.data.detail || err.response.statusText}`);
      } else if (err.request) {
        // Request made but no response
        errorText = "Cannot connect to the backend server. Please ensure it's running on http://localhost:8000";
        setError('Cannot connect to backend server. Is it running?');
      } else {
        // Something else happened
        errorText = `Error: ${err.message}`;
        setError(err.message);
      }

      // Add error message to chat
      const errorMessage = {
        id: messages.length + 2,
        text: errorText,
        sender: 'agent',
        agent: 'System',
        timestamp: new Date().toLocaleTimeString(),
        error: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "Find employees with Python skills",
    "Calculate 25% of 15000", 
    "What is our company's vacation policy?",
    "Show me HR analytics"
  ];

  const handleQuickQuestion = (question) => {
    setInputText(question);
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Unified Chat Interface
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Chat with all specialized agents through a single interface
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
          <Paper elevation={3} sx={{ height: '60vh', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="h6" display="flex" alignItems="center">
                <QuestionAnswer sx={{ mr: 1 }} />
                Enterprise AI Assistant
              </Typography>
            </Box>
            
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
              <List>
                {messages.map((message, index) => (
                  <ListItem
                    key={message.id}
                    alignItems="flex-start"
                    sx={{
                      justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                      mb: 2
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '70%',
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: message.sender === 'user' ? '#e3f2fd' : '#f5f5f5',
                        border: message.error ? '1px solid #f44336' : '1px solid #e0e0e0'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            fontSize: 12,
                            bgcolor: message.sender === 'user' ? '#1976d2' : '#7b1fa2'
                          }}
                        >
                          {message.sender === 'user' ? <Person /> : <SmartToy />}
                        </Avatar>
                        <Box sx={{ ml: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {message.agent} • {message.timestamp}
                          </Typography>
                          {message.confidence && (
                            <Chip
                              label={`${Math.round(message.confidence * 100)}% match`}
                              size="small"
                              sx={{ height: 16, fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                      {(() => {
                        // Check if message.text is already a parsed object (structured response)
                        // or a string (regular response)
                        let structuredData = null;

                        if (typeof message.text === 'object' && message.text !== null) {
                          // It's already a parsed object (structured response)
                          structuredData = message.text;
                        } else {
                          // It's a string, try to parse it in case it's a JSON string
                          try {
                            const parsed = JSON.parse(message.text);
                            if (parsed.answer_markdown || parsed.short_answer || parsed.sources) {
                              // This is the structured format from document agent
                              structuredData = parsed;
                            }
                          } catch (e) {
                            // Not JSON, render as regular text
                            return <Typography variant="body1">{message.text}</Typography>;
                          }
                        }

                        // If we have structured data, use RagResponseCard
                        if (structuredData) {
                          return <RagResponseCard
                            data={structuredData}
                            onFollowUpClick={(question) => {
                              setInputText(question);
                            }}
                            isLatest={index === messages.length - 1}
                          />;
                        } else {
                          // For regular responses, render as text
                          return <Typography variant="body1">{message.text}</Typography>;
                        }
                      })()}
                    </Box>
                  </ListItem>
                ))}
                {loading && (
                  <ListItem alignItems="flex-start" sx={{ justifyContent: 'flex-start', mb: 2 }}>
                    <Box
                      sx={{
                        maxWidth: '70%',
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: '#f5f5f5',
                        border: '1px solid #e0e0e0'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Avatar 
                          sx={{ 
                            width: 24, 
                            height: 24, 
                            fontSize: 12,
                            bgcolor: '#7b1fa2'
                          }}
                        >
                          <SmartToy />
                        </Avatar>
                        <Box sx={{ ml: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Unified Assistant • {new Date().toLocaleTimeString()}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body1" color="text.secondary">
                        Thinking...
                      </Typography>
                    </Box>
                  </ListItem>
                )}
                <div ref={messagesEndRef} />
              </List>
            </Box>
            
            <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  variant="outlined"
                  placeholder="Ask anything to the enterprise assistant..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={loading || !inputText.trim()}
                  sx={{ height: 'fit-content' }}
                >
                  <Send />
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Questions
              </Typography>
              {quickQuestions.map((question, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={() => handleQuickQuestion(question)}
                    sx={{ justifyContent: 'flex-start', mb: 1 }}
                  >
                    {question}
                  </Button>
                </Box>
              ))}
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Available Agents
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip label="HR Assistant" size="small" color="primary" />
                <Chip label="Analytics Assistant" size="small" color="secondary" />
                <Chip label="Document Assistant" size="small" color="default" />
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                How it Works
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your query is intelligently routed to the most appropriate specialized agent. 
                The system understands context and can switch between agents as needed.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default ChatInterface;