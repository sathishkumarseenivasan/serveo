/**
 * MemoryPalace - Advanced graph-based memory system
 * Stores and retrieves server knowledge using semantic relationships
 * 
 * Features:
 * - Graph-based knowledge storage
 * - Semantic similarity search
 * - Temporal memory decay
 * - Context-aware retrieval
 */

import Graph from 'graphology';
import NodeCache from 'node-cache';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/memory-palace.log' })
  ]
});

class MemoryPalace {
  constructor(config = {}) {
    this.graph = new Graph();
    this.cache = new NodeCache({ 
      stdTTL: config.cacheTTL || 3600,
      checkperiod: 600 
    });
    this.memoryDecay = config.memoryDecay || 0.95; // 5% decay per hour
    this.maxNodes = config.maxNodes || 10000;
    this.semanticIndex = new Map();
    this.temporalIndex = new Map();
    
    this.initializeCoreNodes();
  }

  /**
   * Initialize core knowledge nodes
   */
  initializeCoreNodes() {
    const coreConcepts = [
      'server_structure',
      'user_behavior',
      'channel_organization',
      'role_hierarchy',
      'permission_patterns',
      'engagement_metrics',
      'conflict_resolution',
      'event_planning',
      'onboarding_flow',
      'content_moderation'
    ];

    coreConcepts.forEach(concept => {
      this.addNode({
        id: `core_${concept}`,
        type: 'core_concept',
        label: concept,
        weight: 1.0,
        createdAt: Date.now(),
        accessCount: 0
      });
    });

    logger.info('Memory Palace initialized with core concepts');
  }

  /**
   * Add a memory node to the graph
   */
  addNode(memory) {
    // Enforce max nodes limit
    if (this.graph.order >= this.maxNodes) {
      this.pruneOldestMemories();
    }

    const nodeId = memory.id || `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.graph.addNode(nodeId, {
      ...memory,
      createdAt: memory.createdAt || Date.now(),
      updatedAt: Date.now(),
      accessCount: 0,
      decayFactor: 1.0
    });

    // Update indexes
    this.updateSemanticIndex(nodeId, memory);
    this.updateTemporalIndex(nodeId, memory);

    // Connect to related core concepts
    this.connectToRelatedConcepts(nodeId, memory);

    logger.debug('Memory node added', { nodeId, type: memory.type });
    return nodeId;
  }

  /**
   * Add edge between two memories
   */
  addEdge(sourceId, targetId, relationship = 'related') {
    if (!this.graph.hasNode(sourceId) || !this.graph.hasNode(targetId)) {
      logger.warn('Cannot add edge: node not found', { sourceId, targetId });
      return false;
    }

    const edgeKey = `${sourceId}-${targetId}`;
    
    if (this.graph.hasEdge(sourceId, targetId)) {
      // Strengthen existing connection
      const currentWeight = this.graph.getEdgeAttribute(edgeKey, 'weight') || 0.5;
      this.graph.setEdgeAttribute(edgeKey, 'weight', Math.min(currentWeight + 0.1, 1.0));
      this.graph.setEdgeAttribute(edgeKey, 'updatedAt', Date.now());
    } else {
      this.graph.addEdge(sourceId, targetId, {
        relationship,
        weight: 0.5,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }

    logger.debug('Memory edge added/updated', { sourceId, targetId, relationship });
    return true;
  }

  /**
   * Retrieve memory by ID
   */
  getMemory(nodeId) {
    if (!this.graph.hasNode(nodeId)) {
      return null;
    }

    const memory = this.graph.getNodeAttributes(nodeId);
    
    // Increment access count
    this.graph.setNodeAttribute(nodeId, 'accessCount', (memory.accessCount || 0) + 1);
    this.graph.setNodeAttribute(nodeId, 'lastAccessedAt', Date.now());

    // Apply memory decay
    this.applyDecay(nodeId);

    return memory;
  }

  /**
   * Search memories by semantic similarity
   */
  async search(query, options = {}) {
    const { limit = 10, minScore = 0.3, types = [] } = options;
    
    // Check cache first
    const cacheKey = `search_${query}_${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const results = [];
    const queryTokens = query.toLowerCase().split(/\s+/);

    // Iterate through relevant nodes
    const nodesToSearch = types.length > 0 
      ? this.graph.filterNodes((node, attr) => types.includes(attr.type))
      : Array.from(this.graph.nodes());

    for (const nodeId of nodesToSearch.slice(0, 1000)) { // Limit search scope
      const memory = this.graph.getNodeAttributes(nodeId);
      
      // Skip low-weight memories
      if ((memory.decayFactor || 1.0) < minScore) continue;

      const score = this.calculateSemanticSimilarity(queryTokens, memory);
      
      if (score >= minScore) {
        results.push({
          id: nodeId,
          memory,
          score
        });
      }
    }

    // Sort by score and limit results
    results.sort((a, b) => b.score - a.score);
    const limitedResults = results.slice(0, limit);

    // Cache results
    this.cache.set(cacheKey, limitedResults, 300); // 5 minute cache

    return limitedResults;
  }

  /**
   * Calculate semantic similarity between query and memory
   */
  calculateSemanticSimilarity(queryTokens, memory) {
    let score = 0;

    // Text matching
    const searchText = [
      memory.label || '',
      memory.description || '',
      memory.content || '',
      memory.tags || []
    ].join(' ').toLowerCase();

    queryTokens.forEach(token => {
      if (searchText.includes(token)) {
        score += 0.1;
      }
    });

    // Type matching
    if (memory.type === queryTokens.find(t => ['core_concept', 'user', 'channel', 'role', 'event'].includes(t))) {
      score += 0.3;
    }

    // Recency boost
    const ageHours = (Date.now() - memory.createdAt) / (1000 * 60 * 60);
    const recencyBoost = Math.exp(-ageHours / 24); // Decay over 24 hours
    score *= (1 + recencyBoost * 0.2);

    // Access frequency boost
    const accessBoost = Math.min((memory.accessCount || 0) / 10, 0.3);
    score += accessBoost;

    return Math.min(score, 1.0);
  }

  /**
   * Get related memories
   */
  getRelated(nodeId, options = {}) {
    const { limit = 5, minWeight = 0.3, depth = 1 } = options;
    
    if (!this.graph.hasNode(nodeId)) {
      return [];
    }

    const related = [];
    const visited = new Set([nodeId]);
    const queue = [{ nodeId, depth: 0 }];

    while (queue.length > 0 && related.length < limit) {
      const { nodeId: currentId, depth: currentDepth } = queue.shift();
      
      if (currentDepth > depth) continue;

      const neighbors = this.graph.neighbors(currentId);
      
      for (const neighborId of neighbors) {
        if (visited.has(neighborId)) continue;
        visited.add(neighborId);

        const edgeKey = `${currentId}-${neighborId}`;
        const edgeWeight = this.graph.getEdgeAttribute(edgeKey, 'weight') || 0.5;

        if (edgeWeight >= minWeight) {
          const memory = this.graph.getNodeAttributes(neighborId);
          related.push({
            id: neighborId,
            memory,
            relationship: this.graph.getEdgeAttribute(edgeKey, 'relationship'),
            weight: edgeWeight,
            depth: currentDepth + 1
          });

          if (currentDepth + 1 < depth) {
            queue.push({ nodeId: neighborId, depth: currentDepth + 1 });
          }
        }
      }
    }

    return related.sort((a, b) => b.weight - a.weight);
  }

  /**
   * Apply memory decay to a node
   */
  applyDecay(nodeId) {
    const memory = this.graph.getNodeAttributes(nodeId);
    if (!memory) return;

    const ageHours = (Date.now() - memory.createdAt) / (1000 * 60 * 60);
    const newDecayFactor = Math.pow(this.memoryDecay, ageHours);

    this.graph.setNodeAttribute(nodeId, 'decayFactor', newDecayFactor);

    // Prune if decay is too high
    if (newDecayFactor < 0.1 && memory.type !== 'core_concept') {
      this.removeNode(nodeId);
    }
  }

  /**
   * Remove a memory node
   */
  removeNode(nodeId) {
    if (!this.graph.hasNode(nodeId)) return false;

    // Remove from indexes
    this.removeFromIndexes(nodeId);

    // Remove node (also removes connected edges)
    this.graph.dropNode(nodeId);

    logger.debug('Memory node removed', { nodeId });
    return true;
  }

  /**
   * Prune oldest memories
   */
  pruneOldestMemories(count = 100) {
    const nodes = Array.from(this.graph.nodes())
      .map(id => ({
        id,
        attributes: this.graph.getNodeAttributes(id)
      }))
      .filter(n => n.attributes.type !== 'core_concept')
      .sort((a, b) => a.attributes.createdAt - b.attributes.createdAt)
      .slice(0, count);

    nodes.forEach(n => this.removeNode(n.id));
    logger.info('Pruned old memories', { count: nodes.length });
  }

  /**
   * Update semantic index
   */
  updateSemanticIndex(nodeId, memory) {
    const keywords = [
      ...(memory.keywords || []),
      ...(memory.tags || []),
      memory.type,
      memory.label
    ].filter(Boolean).map(k => k.toLowerCase());

    keywords.forEach(keyword => {
      if (!this.semanticIndex.has(keyword)) {
        this.semanticIndex.set(keyword, new Set());
      }
      this.semanticIndex.get(keyword).add(nodeId);
    });
  }

  /**
   * Update temporal index
   */
  updateTemporalIndex(nodeId, memory) {
    const date = new Date(memory.createdAt).toDateString();
    
    if (!this.temporalIndex.has(date)) {
      this.temporalIndex.set(date, new Set());
    }
    this.temporalIndex.get(date).add(nodeId);
  }

  /**
   * Remove from indexes
   */
  removeFromIndexes(nodeId) {
    const memory = this.graph.getNodeAttributes(nodeId);
    if (!memory) return;

    // Remove from semantic index
    const keywords = [
      ...(memory.keywords || []),
      ...(memory.tags || []),
      memory.type,
      memory.label
    ].filter(Boolean).map(k => k.toLowerCase());

    keywords.forEach(keyword => {
      const set = this.semanticIndex.get(keyword);
      if (set) {
        set.delete(nodeId);
        if (set.size === 0) {
          this.semanticIndex.delete(keyword);
        }
      }
    });

    // Remove from temporal index
    const date = new Date(memory.createdAt).toDateString();
    const dateSet = this.temporalIndex.get(date);
    if (dateSet) {
      dateSet.delete(nodeId);
      if (dateSet.size === 0) {
        this.temporalIndex.delete(date);
      }
    }
  }

  /**
   * Connect new memory to related core concepts
   */
  connectToRelatedConcepts(nodeId, memory) {
    const coreConcepts = this.graph.filterNodes((node, attr) => attr.type === 'core_concept');
    
    coreConcepts.forEach(coreId => {
      const coreLabel = this.graph.getNodeAttribute(coreId, 'label');
      
      if (memory.type?.includes(coreLabel) || 
          memory.label?.includes(coreLabel) ||
          memory.content?.toLowerCase().includes(coreLabel)) {
        this.addEdge(nodeId, coreId, 'relates_to');
      }
    });
  }

  /**
   * Get memory statistics
   */
  getStats() {
    return {
      totalNodes: this.graph.order,
      totalEdges: this.graph.size,
      cacheSize: this.cache.keys().length,
      semanticIndexSize: this.semanticIndex.size,
      temporalIndexSize: this.temporalIndex.size,
      nodeTypes: this.getNodeTypeDistribution(),
      averageDecay: this.getAverageDecay()
    };
  }

  /**
   * Get distribution of node types
   */
  getNodeTypeDistribution() {
    const distribution = {};
    
    this.graph.forEachNode((node, attr) => {
      const type = attr.type || 'unknown';
      distribution[type] = (distribution[type] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Get average decay factor
   */
  getAverageDecay() {
    let sum = 0;
    let count = 0;
    
    this.graph.forEachNode((node, attr) => {
      sum += attr.decayFactor || 1.0;
      count++;
    });

    return count > 0 ? sum / count : 1.0;
  }

  /**
   * Export memory palace state
   */
  exportState() {
    return {
      graph: this.graph.export(),
      semanticIndex: Array.from(this.semanticIndex.entries()).map(([k, v]) => [k, Array.from(v)]),
      temporalIndex: Array.from(this.temporalIndex.entries()).map(([k, v]) => [k, Array.from(v)]),
      exportedAt: Date.now()
    };
  }

  /**
   * Import memory palace state
   */
  importState(state) {
    try {
      this.graph.import(state.graph);
      
      this.semanticIndex = new Map(
        state.semanticIndex.map(([k, v]) => [k, new Set(v)])
      );
      
      this.temporalIndex = new Map(
        state.temporalIndex.map(([k, v]) => [k, new Set(v)])
      );

      logger.info('Memory Palace state imported successfully');
    } catch (error) {
      logger.error('Failed to import Memory Palace state', { error });
    }
  }

  /**
   * Clear all non-core memories
   */
  clear() {
    const coreNodes = this.graph.filterNodes((node, attr) => attr.type === 'core_concept');
    const nonCoreNodes = Array.from(this.graph.nodes()).filter(n => !coreNodes.includes(n));
    
    nonCoreNodes.forEach(nodeId => this.removeNode(nodeId));
    this.cache.flushAll();
    
    logger.info('Memory Palace cleared (core concepts preserved)');
  }
}

export default MemoryPalace;
