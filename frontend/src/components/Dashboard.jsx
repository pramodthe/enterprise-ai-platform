import React from 'react';
import { Grid, Paper, Typography, Card, CardContent } from '@mui/material';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const features = [
    {
      title: 'HR Assistant',
      description: 'Employee lookup, skill matching, and organizational charts',
      link: '/hr',
      color: '#1976d2'
    },
    {
      title: 'Analytics Hub',
      description: 'Business calculations and data analysis tools',
      link: '/analytics',
      color: '#388e3c'
    },
    {
      title: 'Document Intelligence',
      description: 'Search and retrieve information from company documents',
      link: '/documents',
      color: '#7b1fa2'
    },
    {
      title: 'Unified Chat',
      description: 'Chat with all agents from a single interface',
      link: '/chat',
      color: '#e53935'
    }
  ];

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Enterprise AI Assistant Platform
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Your intelligent enterprise assistant with multiple specialized agents
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Link 
              to={feature.link} 
              style={{ 
                textDecoration: 'none', 
                color: 'inherit' 
              }}
            >
              <Card 
                sx={{ 
                  height: '100%', 
                  backgroundColor: `${feature.color}10`,
                  borderLeft: `4px solid ${feature.color}`,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  }
                }}
              >
                <CardContent>
                  <Typography variant="h6" color={feature.color} gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Link>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default Dashboard;