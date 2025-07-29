const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from build directory
app.use(express.static(path.join(__dirname, 'build')));

// Handle React Router - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Test VPN path at: http://localhost:${port}/web_forward_CuttingApplicationAPI/`);
});
