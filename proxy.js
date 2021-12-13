'use strict';
require('./env.js');
const express = require('express');
const proxy = require('express-http-proxy');
const path = require('path');
const cors = require('cors');

if(process.env.MODE !== 'vault') {
  return;
}

const app = express();

app.use(cors());

const PORT = process.env.PORT || 8080;
app.use('/api', proxy(`localhost:${PORT}`));

const buildPath = path.normalize(path.join(__dirname, './frontend'));
app.use(express.static(buildPath));

const rootRouter = express.Router();

rootRouter.get('/', async (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

rootRouter.get('/details', async (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

rootRouter.get('/registration', async (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.use(rootRouter);

const UI_PORT = process.env.UI_PORT || 3000;
app.listen(UI_PORT, () => {
  console.log(`Server listening on port ${UI_PORT}...`);
});
