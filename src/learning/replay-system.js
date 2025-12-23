/**
 * Replay Learning System
 * Learns from recorded gameplay to improve agent planning
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ReplaySystem {
  constructor(config = {}) {
    this.config = {
      maxReplays: 1000,
      learningRate: 0.01,
      batchSize: 32,
      ...config
    };
    this.replays = [];
    this.patterns = new Map();
    this.logger = require('../utils/logger');
  }

  /**
   * Record a gameplay session
   * @param {string} gameType - Type of game (Roblox, Minecraft, etc)
   * @param {Array<Object>} actions - List of actions taken
   * @param {Number} successRate - How successful the session was (0-1)
   */
  recordSession(gameType, actions, successRate) {
    const sessionId = crypto.randomBytes(8).toString('hex');
    const timestamp = new Date().toISOString();
    
    const session = {
      id: sessionId,
      gameType,
      timestamp,
      actions,
      successRate,
      patterns: this.extractPatterns(actions)
    };
    
    this.replays.push(session);
    if (this.replays.length > this.config.maxReplays) {
      this.replays.shift();
    }
    
    this.logger.info(`Recorded session ${sessionId}`, { gameType, actionCount: actions.length });
    return sessionId;
  }

  /**
   * Extract patterns from action sequence
   * @param {Array<Object>} actions - Sequence of actions
   * @returns {Array<string>} Pattern signatures
   */
  extractPatterns(actions) {
    const patterns = [];
    
    for (let i = 0; i < actions.length - 2; i++) {
      const triple = [
        actions[i].type,
        actions[i + 1].type,
        actions[i + 2].type
      ].join('-');
      
      patterns.push(triple);
      
      if (!this.patterns.has(triple)) {
        this.patterns.set(triple, { count: 0, successTotal: 0 });
      }
      
      const patternData = this.patterns.get(triple);
      patternData.count++;
    }
    
    return patterns;
  }

  /**
   * Learn from successful replays
   * @param {Number} threshold - Minimum success rate to learn from
   * @returns {Object} Learning statistics
   */
  learnFromSuccessfulReplays(threshold = 0.7) {
    const successfulReplays = this.replays.filter(r => r.successRate >= threshold);
    let totalPatternsLearned = 0;
    
    for (const replay of successfulReplays) {
      for (const pattern of replay.patterns) {
        if (this.patterns.has(pattern)) {
          const data = this.patterns.get(pattern);
          data.successTotal += replay.successRate;
          totalPatternsLearned++;
        }
      }
    }
    
    this.logger.info('Learning complete', {
      successfulSessions: successfulReplays.length,
      patternsAnalyzed: totalPatternsLearned
    });
    
    return {
      successfulReplays: successfulReplays.length,
      patternsLearned: totalPatternsLearned,
      totalPatterns: this.patterns.size
    };
  }

  /**
   * Get recommended action sequences
   * @param {string} currentContext - Current game state
   * @param {Number} topK - Return top K patterns
   * @returns {Array<Object>} Recommended patterns ranked by success
   */
  getRecommendedPatterns(currentContext, topK = 5) {
    const patternScores = Array.from(this.patterns.entries())
      .map(([pattern, data]) => ({
        pattern,
        successRate: data.count > 0 ? data.successTotal / data.count : 0,
        frequency: data.count
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, topK);
    
    return patternScores;
  }

  /**
   * Save replays to disk for persistence
   * @param {string} dir - Directory to save to
   */
  async saveReplays(dir) {
    try {
      const filename = path.join(dir, `replays-${Date.now()}.json`);
      const data = {
        timestamp: new Date().toISOString(),
        replays: this.replays,
        patterns: Array.from(this.patterns.entries())
      };
      
      await fs.writeFile(filename, JSON.stringify(data, null, 2));
      this.logger.info(`Saved ${this.replays.length} replays to ${filename}`);
    } catch (error) {
      this.logger.error('Failed to save replays', { error: error.message });
    }
  }

  /**
   * Load replays from disk
   * @param {string} filename - File to load
   */
  async loadReplays(filename) {
    try {
      const data = JSON.parse(await fs.readFile(filename, 'utf-8'));
      this.replays = data.replays || [];
      this.patterns = new Map(data.patterns || []);
      
      this.logger.info(`Loaded ${this.replays.length} replays from ${filename}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to load replays', { error: error.message });
      return false;
    }
  }

  /**
   * Get learning statistics
   * @returns {Object} Current learning stats
   */
  getStats() {
    const avgSuccessRate = this.replays.length > 0
      ? this.replays.reduce((sum, r) => sum + r.successRate, 0) / this.replays.length
      : 0;
    
    return {
      totalSessions: this.replays.length,
      totalPatterns: this.patterns.size,
      averageSuccessRate: avgSuccessRate,
      topPatterns: this.getRecommendedPatterns('', 3)
    };
  }
}

module.exports = ReplaySystem;
