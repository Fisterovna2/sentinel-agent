/**
 * Web API Server
 * Provides restricted HTTP interface for remote Sentinel control
 */

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

class APIServer {
  constructor(agentCore, config = {}) {
    this.agent = agentCore;
    this.app = express();
    this.port = config.port || 8080;
    this.jwtSecret = config.jwtSecret || 'sentinel-secret';
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors({ origin: 'localhost' }));
    this.app.use(express.json());
    this.app.use(rateLimit({ windowMs: 60000, max: 100 }));
    this.app.use((req, res, next) => this.authenticate(req, res, next));
  }

  authenticate(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    try {
      req.user = jwt.verify(token, this.jwtSecret);
      next();
    } catch (e) {
      res.status(401).json({ error: 'Unauthorized' });
    }
  }

  setupRoutes() {
    this.app.get('/api/status', (req, res) => {
      res.json({
        running: this.agent.isRunning(),
        activeGame: this.agent.getCurrentGame(),
        successRate: this.agent.getSuccessRate()
      });
    });

    this.app.post('/api/task', (req, res) => {
      const { type, target, params } = req.body;
      const result = this.agent.executeTask(type, target, params);
      res.json({ taskId: result.id, status: 'queued' });
    });

    this.app.get('/api/logs', (req, res) => {
      const logs = this.agent.getLogs({ limit: 100 });
      res.json({ logs });
    });

    this.app.post('/api/approve', (req, res) => {
      const { taskId } = req.body;
      this.agent.approveTask(taskId);
      res.json({ approved: true });
    });
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`API Server running on port ${this.port}`);
    });
  }
}

module.exports = APIServer;
