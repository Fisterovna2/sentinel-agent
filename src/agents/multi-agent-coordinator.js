/**
 * Multi-Agent Coordinator
 * Manages coordination between multiple Sentinel agents for complex tasks
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class MultiAgentCoordinator extends EventEmitter {
  constructor(config = {}) {
    super();
    this.agents = new Map();
    this.tasks = new Map();
    this.config = config;
    this.logger = require('../utils/logger');
  }

  /**
   * Register an agent with the coordinator
   * @param {string} agentId - Unique agent identifier
   * @param {Object} agent - Agent instance
   */
  registerAgent(agentId, agent) {
    this.agents.set(agentId, {
      instance: agent,
      status: 'ready',
      tasksCompleted: 0,
      successRate: 1.0
    });
    this.logger.info(`Agent ${agentId} registered`);
  }

  /**
   * Distribute a complex task to multiple agents
   * @param {string} taskId - Task identifier
   * @param {Array<Object>} subtasks - Subtasks for agents
   * @returns {Promise<Object>} Aggregated results
   */
  async distributeTask(taskId, subtasks) {
    const taskKey = crypto.randomBytes(8).toString('hex');
    const assignments = this.allocateSubtasks(subtasks);
    const promises = [];

    for (const [agentId, subtask] of assignments) {
      const agent = this.agents.get(agentId);
      if (agent) {
        promises.push(
          agent.instance.execute(subtask)
            .then(result => ({ agentId, success: true, result }))
            .catch(error => ({ agentId, success: false, error }))
        );
      }
    }

    const results = await Promise.allSettled(promises);
    this.tasks.set(taskKey, { taskId, results, timestamp: Date.now() });
    
    return this.aggregateResults(results);
  }

  /**
   * Allocate subtasks to agents based on their capabilities
   * @param {Array<Object>} subtasks - Subtasks to allocate
   * @returns {Map<string, Object>} Agent-to-subtask mapping
   */
  allocateSubtasks(subtasks) {
    const allocations = new Map();
    const readyAgents = Array.from(this.agents.entries())
      .filter(([_, data]) => data.status === 'ready')
      .sort((a, b) => b[1].successRate - a[1].successRate);

    let agentIndex = 0;
    for (const subtask of subtasks) {
      if (readyAgents.length === 0) break;
      const [agentId] = readyAgents[agentIndex % readyAgents.length];
      allocations.set(agentId, subtask);
      agentIndex++;
    }

    return allocations;
  }

  /**
   * Aggregate results from multiple agents
   * @param {Array} results - Results from Promise.allSettled
   * @returns {Object} Aggregated data
   */
  aggregateResults(results) {
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
    const failed = results.filter(r => r.status === 'rejected' || !r.value.success);

    return {
      totalTasks: results.length,
      successful: successful.length,
      failed: failed.length,
      successRate: successful.length / results.length,
      data: successful.map(r => r.value.result),
      errors: failed.map(r => r.value.error || r.reason)
    };
  }

  /**
   * Get coordinator status and agent metrics
   * @returns {Object} Status information
   */
  getStatus() {
    const agentStats = Array.from(this.agents.entries()).map(([id, data]) => ({
      id,
      status: data.status,
      tasksCompleted: data.tasksCompleted,
      successRate: data.successRate
    }));

    return {
      agentsCount: this.agents.size,
      tasksCount: this.tasks.size,
      agents: agentStats,
      averageSuccessRate: agentStats.length > 0
        ? agentStats.reduce((sum, a) => sum + a.successRate, 0) / agentStats.length
        : 0
    };
  }

  /**
   * Synchronize agent states
   * @param {Array<string>} agentIds - Agents to sync
   */
  async synchronizeAgents(agentIds) {
    for (const agentId of agentIds) {
      const agent = this.agents.get(agentId);
      if (agent && agent.instance.sync) {
        await agent.instance.sync();
      }
    }
    this.logger.info(`Synchronized ${agentIds.length} agents`);
  }
}

module.exports = MultiAgentCoordinator;
