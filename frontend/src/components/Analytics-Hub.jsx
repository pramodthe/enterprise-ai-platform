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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { analyticsQuery } from '../services/api';

const AnalyticsHub = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [calculationDetails, setCalculationDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Payroll calculation fields
  const [employeeType, setEmployeeType] = useState('fulltime');
  const [annualSalary, setAnnualSalary] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [hours, setHours] = useState('');
  const [federalTaxRate, setFederalTaxRate] = useState('12');
  const [stateTaxRate, setStateTaxRate] = useState('5');
  const [preTaxDeductions, setPreTaxDeductions] = useState('');
  const [postTaxDeductions, setPostTaxDeductions] = useState('');

  const handleQuerySubmit = async () => {
    handleQuerySubmitWithText(query);
  };

  const handlePayrollCalculation = () => {
    let payrollQuery = '';
    
    if (employeeType === 'fulltime') {
      if (!annualSalary) {
        setError('Please enter annual salary for full-time employee');
        return;
      }
      payrollQuery = `Calculate payroll for full-time employee with annual salary $${annualSalary}, `;
      payrollQuery += `federal tax ${federalTaxRate}%, state tax ${stateTaxRate}%`;
      if (preTaxDeductions) payrollQuery += `, pre-tax deductions $${preTaxDeductions}`;
      if (postTaxDeductions) payrollQuery += `, post-tax deductions $${postTaxDeductions}`;
    } else {
      if (!hourlyRate || !hours) {
        setError('Please enter hourly rate and hours for part-time employee');
        return;
      }
      payrollQuery = `Calculate payroll for part-time employee with hourly rate $${hourlyRate} for ${hours} hours, `;
      payrollQuery += `federal tax ${federalTaxRate}%, state tax ${stateTaxRate}%`;
      if (preTaxDeductions) payrollQuery += `, pre-tax deductions $${preTaxDeductions}`;
      if (postTaxDeductions) payrollQuery += `, post-tax deductions $${postTaxDeductions}`;
    }
    
    setQuery(payrollQuery);
    // Trigger the query
    handleQuerySubmitWithText(payrollQuery);
  };

  const handleQuerySubmitWithText = async (queryText) => {
    if (!queryText.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      const response = await analyticsQuery(queryText);
      setResult(response.result);
      setCalculationDetails(response.calculation_details);
    } catch (err) {
      setError('Error communicating with Analytics agent. Please try again.');
      console.error('Analytics Agent Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exampleQueries = [
    "Calculate 25% of 15000",
    "What is 1200 divided by 24?",
    "Calculate percentage change from 100 to 150",
    "Find average of 10, 20, 30, and 40",
    "Full-time employee $78,000 annually, federal 12%, state 5%, 401k $200 per period"
  ];

  const handleExampleClick = (example) => {
    setQuery(example);
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Analytics Hub
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Business calculations and data analysis tools
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Payroll Calculator
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Button
                    variant={employeeType === 'fulltime' ? 'contained' : 'outlined'}
                    onClick={() => setEmployeeType('fulltime')}
                  >
                    Full-Time (Salary)
                  </Button>
                  <Button
                    variant={employeeType === 'parttime' ? 'contained' : 'outlined'}
                    onClick={() => setEmployeeType('parttime')}
                  >
                    Part-Time (Hourly)
                  </Button>
                </Box>
              </Grid>
              
              {employeeType === 'fulltime' ? (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Annual Salary ($)"
                    type="number"
                    value={annualSalary}
                    onChange={(e) => setAnnualSalary(e.target.value)}
                    placeholder="e.g., 78000"
                  />
                </Grid>
              ) : (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Hourly Rate ($)"
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder="e.g., 25"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Hours Worked"
                      type="number"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      placeholder="e.g., 40"
                    />
                  </Grid>
                </>
              )}
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Federal Tax Rate (%)"
                  type="number"
                  value={federalTaxRate}
                  onChange={(e) => setFederalTaxRate(e.target.value)}
                  placeholder="e.g., 12"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="State Tax Rate (%)"
                  type="number"
                  value={stateTaxRate}
                  onChange={(e) => setStateTaxRate(e.target.value)}
                  placeholder="e.g., 5"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Pre-Tax Deductions ($)"
                  type="number"
                  value={preTaxDeductions}
                  onChange={(e) => setPreTaxDeductions(e.target.value)}
                  placeholder="e.g., 401k contributions"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Post-Tax Deductions ($)"
                  type="number"
                  value={postTaxDeductions}
                  onChange={(e) => setPostTaxDeductions(e.target.value)}
                  placeholder="e.g., union fees"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handlePayrollCalculation}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? 'Calculating...' : 'Calculate Payroll'}
                </Button>
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Custom Query
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              placeholder="Or ask for any calculations or data analysis..."
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
                {loading ? 'Processing...' : 'Analyze Data'}
              </Button>
            </Box>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {result && (
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Analytics Result:
              </Typography>
              <Typography variant="body1">
                {result}
              </Typography>
            </Paper>
          )}

          {calculationDetails && (
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Calculation Details:
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>Original Query</strong></TableCell>
                      <TableCell>{calculationDetails.query}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Tools Used</strong></TableCell>
                      <TableCell>{calculationDetails.tools_used?.join(', ') || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Timestamp</strong></TableCell>
                      <TableCell>{new Date(calculationDetails.timestamp * 1000).toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
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
                  Available Tools
                </Typography>
                <ul>
                  <li>Payroll Calculator (wages vs taxes)</li>
                  <li>Addition & Subtraction</li>
                  <li>Multiplication & Division</li>
                  <li>Percentage change</li>
                  <li>Average calculation</li>
                </ul>
              </Box>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Payroll Info
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  The payroll calculator includes:
                  <ul>
                    <li>Federal & State taxes</li>
                    <li>Social Security (6.2%)</li>
                    <li>Medicare (1.45%)</li>
                    <li>Pre/Post-tax deductions</li>
                    <li>Employer costs</li>
                  </ul>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default AnalyticsHub;