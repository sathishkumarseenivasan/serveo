/**
 * Adaptix - Self-adapting permission and role system
 * Automatically adjusts permissions based on behavioral patterns and community health
 * 
 * Features:
 * - Behavioral role assignment
 * - Dynamic permission scaling
 * - Trust score calculation
 * - Automatic privilege escalation/de-escalation
 */

import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/adaptix.log' })
  ]
});

class Adaptix {
  constructor(config = {}) {
    this.config = config;
    this.userProfiles = new Map();
    this.trustScores = new Map();
    this.behaviorHistory = new Map();
    this.roleRules = new Map();
    this.permissionTemplates = this.initializePermissionTemplates();
    this.adaptationLog = [];
    
    this.initializeDefaultRules();
  }

  /**
   * Initialize default permission templates
   */
  initializePermissionTemplates() {
    return {
      newcomer: {
        sendMessages: false,
        addReactions: true,
        readMessageHistory: true,
        connect: false,
        speak: false
      },
      trusted: {
        sendMessages: true,
        addReactions: true,
        readMessageHistory: true,
        connect: true,
        speak: true,
        attachFiles: true,
        embedLinks: true
      },
      veteran: {
        sendMessages: true,
        addReactions: true,
        readMessageHistory: true,
        connect: true,
        speak: true,
        attachFiles: true,
        embedLinks: true,
        manageMessages: false,
        mentionEveryone: false
      },
      moderator: {
        sendMessages: true,
        addReactions: true,
        readMessageHistory: true,
        connect: true,
        speak: true,
        attachFiles: true,
        embedLinks: true,
        manageMessages: true,
        kickMembers: true,
        banMembers: false,
        timeoutMembers: true
      },
      admin: {
        sendMessages: true,
        addReactions: true,
        readMessageHistory: true,
        connect: true,
        speak: true,
        attachFiles: true,
        embedLinks: true,
        manageMessages: true,
        manageChannels: true,
        manageRoles: true,
        kickMembers: true,
        banMembers: true,
        timeoutMembers: true,
        manageGuild: true
      }
    };
  }

  /**
   * Initialize default role assignment rules
   */
  initializeDefaultRules() {
    this.roleRules.set('newcomer_to_trusted', {
      fromRole: 'newcomer',
      toRole: 'trusted',
      conditions: {
        messageCount: 50,
        daysSinceJoin: 7,
        noWarnings: true,
        positiveReactions: 10
      },
      autoApply: true
    });

    this.roleRules.set('trusted_to_veteran', {
      fromRole: 'trusted',
      toRole: 'veteran',
      conditions: {
        messageCount: 500,
        daysSinceJoin: 30,
        noWarnings: true,
        positiveReactions: 100,
        helpfulActions: 20
      },
      autoApply: true
    });

    this.roleRules.set('veteran_to_moderator', {
      fromRole: 'veteran',
      toRole: 'moderator',
      conditions: {
        messageCount: 2000,
        daysSinceJoin: 90,
        noWarnings: true,
        positiveReactions: 500,
        helpfulActions: 100,
        manualApproval: true
      },
      autoApply: false
    });

    logger.info('Adaptix initialized with default rules');
  }

  /**
   * Record user behavior
   */
  recordBehavior(userId, behavior) {
    if (!this.behaviorHistory.has(userId)) {
      this.behaviorHistory.set(userId, []);
    }

    const history = this.behaviorHistory.get(userId);
    history.push({
      ...behavior,
      timestamp: Date.now()
    });

    // Keep only last 1000 behaviors
    if (history.length > 1000) {
      history.shift();
    }

    // Update trust score
    this.updateTrustScore(userId, behavior);

    // Check for role adaptations
    this.checkRoleAdaptations(userId);

    logger.debug('Behavior recorded', { userId, type: behavior.type });
  }

  /**
   * Update user trust score
   */
  updateTrustScore(userId, behavior) {
    let score = this.trustScores.get(userId) || 50; // Start at 50

    // Behavior impact on trust
    const impacts = {
      'positive_message': 0.5,
      'helpful_answer': 2.0,
      'received_reaction_positive': 0.3,
      'received_reaction_negative': -0.5,
      'warning_received': -5.0,
      'timeout_received': -10.0,
      'spam_detected': -3.0,
      'helpful_report': 1.0,
      'community_event_participation': 1.0,
      'days_active_streak': 0.2
    };

    const impact = impacts[behavior.type] || 0;
    score += impact;

    // Normalize to 0-100
    score = Math.min(Math.max(score, 0), 100);

    this.trustScores.set(userId, score);

    // Update user profile
    this.updateUserProfile(userId, { trustScore: score });

    return score;
  }

  /**
   * Update user profile
   */
  updateUserProfile(userId, updates) {
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
        id: userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        trustScore: 50,
        currentRole: 'newcomer',
        messageCount: 0,
        daysSinceJoin: 0,
        warnings: 0,
        positiveReactions: 0,
        helpfulActions: 0,
        activityStreak: 0,
        lastActiveAt: Date.now()
      });
    }

    const profile = this.userProfiles.get(userId);
    Object.assign(profile, updates);
    profile.updatedAt = Date.now();

    return profile;
  }

  /**
   * Check if user qualifies for role adaptation
   */
  checkRoleAdaptations(userId) {
    const profile = this.userProfiles.get(userId);
    if (!profile) return;

    for (const [ruleId, rule] of this.roleRules.entries()) {
      if (profile.currentRole !== rule.fromRole) continue;
      if (!rule.autoApply && rule.conditions.manualApproval) continue;

      if (this.meetsConditions(userId, rule.conditions)) {
        logger.info('Role adaptation triggered', { userId, ruleId, from: rule.fromRole, to: rule.toRole });
        
        this.adaptationLog.push({
          userId,
          ruleId,
          from: rule.fromRole,
          to: rule.toRole,
          timestamp: Date.now(),
          autoApplied: true
        });

        // Emit adaptation event (to be handled by Discord integration)
        this.emit('roleAdaptation', { userId, from: rule.fromRole, to: rule.toRole });
      }
    }
  }

  /**
   * Check if user meets role conditions
   */
  meetsConditions(userId, conditions) {
    const profile = this.userProfiles.get(userId);
    if (!profile) return false;

    for (const [condition, requiredValue] of Object.entries(conditions)) {
      if (condition === 'manualApproval') continue;

      const actualValue = profile[condition] || 0;
      
      if (condition === 'noWarnings') {
        if (profile.warnings > 0) return false;
      } else if (actualValue < requiredValue) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get recommended permissions for user
   */
  getRecommendedPermissions(userId) {
    const profile = this.userProfiles.get(userId);
    const trustScore = this.trustScores.get(userId) || 50;

    // Determine role tier based on trust score
    let roleTier = 'newcomer';
    if (trustScore >= 80) roleTier = 'veteran';
    else if (trustScore >= 60) roleTier = 'trusted';
    else if (trustScore >= 40) roleTier = 'newcomer';
    else roleTier = 'restricted';

    const basePermissions = this.permissionTemplates[roleTier] || this.permissionTemplates.newcomer;

    // Adjust permissions based on specific behaviors
    const adjustedPermissions = { ...basePermissions };

    // Check recent behavior for adjustments
    const recentBehaviors = this.getRecentBehaviors(userId, 50);
    const hasSpamHistory = recentBehaviors.some(b => b.type === 'spam_detected');
    const hasHelpfulHistory = recentBehaviors.some(b => b.type === 'helpful_answer');

    if (hasSpamHistory) {
      adjustedPermissions.attachFiles = false;
      adjustedPermissions.embedLinks = false;
    }

    if (hasHelpfulHistory && roleTier === 'trusted') {
      adjustedPermissions.manageMessages = true; // Can help moderate
    }

    return {
      roleTier,
      permissions: adjustedPermissions,
      trustScore,
      reasoning: this.generatePermissionReasoning(userId, roleTier, adjustedPermissions)
    };
  }

  /**
   * Generate explanation for permission recommendations
   */
  generatePermissionReasoning(userId, roleTier, permissions) {
    const profile = this.userProfiles.get(userId);
    const reasons = [];

    reasons.push(`Trust score: ${this.trustScores.get(userId) || 50}/100`);
    reasons.push(`Current role tier: ${roleTier}`);

    if (profile) {
      if (profile.messageCount > 0) {
        reasons.push(`Message count: ${profile.messageCount}`);
      }
      if (profile.warnings > 0) {
        reasons.push(`Warnings: ${profile.warnings} (affecting permissions)`);
      }
      if (profile.helpfulActions > 0) {
        reasons.push(`Helpful actions: ${profile.helpfulActions}`);
      }
    }

    return reasons;
  }

  /**
   * Get recent behaviors for user
   */
  getRecentBehaviors(userId, limit = 100) {
    const history = this.behaviorHistory.get(userId) || [];
    return history.slice(-limit);
  }

  /**
   * Manually adjust user role
   */
  adjustRole(userId, newRole, reason = 'Manual adjustment') {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      logger.warn('Cannot adjust role: user profile not found', { userId });
      return false;
    }

    const oldRole = profile.currentRole;
    profile.currentRole = newRole;

    this.adaptationLog.push({
      userId,
      from: oldRole,
      to: newRole,
      timestamp: Date.now(),
      reason,
      autoApplied: false
    });

    logger.info('Role manually adjusted', { userId, from: oldRole, to: newRole, reason });
    return true;
  }

  /**
   * Add warning to user
   */
  addWarning(userId, reason) {
    const profile = this.userProfiles.get(userId);
    if (!profile) return false;

    profile.warnings = (profile.warnings || 0) + 1;
    
    // Record negative behavior
    this.recordBehavior(userId, {
      type: 'warning_received',
      reason
    });

    // Auto-demote if too many warnings
    if (profile.warnings >= 3 && profile.currentRole !== 'newcomer') {
      this.adjustRole(userId, 'newcomer', `Too many warnings (${profile.warnings})`);
    }

    logger.warn('Warning added', { userId, reason, totalWarnings: profile.warnings });
    return true;
  }

  /**
   * Get user profile summary
   */
  getUserProfile(userId) {
    const profile = this.userProfiles.get(userId);
    const trustScore = this.trustScores.get(userId) || 50;
    const recommendedPermissions = this.getRecommendedPermissions(userId);

    return {
      ...profile,
      trustScore,
      recommendedPermissions,
      recentBehaviors: this.getRecentBehaviors(userId, 10)
    };
  }

  /**
   * Get adaptation statistics
   */
  getStats() {
    const adaptations = this.adaptationLog.filter(a => a.autoApplied);
    const manualAdjustments = this.adaptationLog.filter(a => !a.autoApplied);

    return {
      totalUsers: this.userProfiles.size,
      averageTrustScore: this.calculateAverageTrustScore(),
      totalAdaptations: adaptations.length,
      manualAdjustments: manualAdjustments.length,
      roleDistribution: this.getRoleDistribution(),
      trustScoreDistribution: this.getTrustScoreDistribution(),
      recentAdaptations: adaptations.slice(-10)
    };
  }

  /**
   * Calculate average trust score
   */
  calculateAverageTrustScore() {
    if (this.trustScores.size === 0) return 50;

    let sum = 0;
    for (const score of this.trustScores.values()) {
      sum += score;
    }
    return sum / this.trustScores.size;
  }

  /**
   * Get role distribution
   */
  getRoleDistribution() {
    const distribution = {};
    
    for (const profile of this.userProfiles.values()) {
      const role = profile.currentRole || 'unknown';
      distribution[role] = (distribution[role] || 0) + 1;
    }

    return distribution;
  }

  /**
   * Get trust score distribution
   */
  getTrustScoreDistribution() {
    const ranges = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0
    };

    for (const score of this.trustScores.values()) {
      if (score <= 20) ranges['0-20']++;
      else if (score <= 40) ranges['21-40']++;
      else if (score <= 60) ranges['41-60']++;
      else if (score <= 80) ranges['61-80']++;
      else ranges['81-100']++;
    }

    return ranges;
  }

  /**
   * Export adaptix state
   */
  exportState() {
    return {
      userProfiles: Array.from(this.userProfiles.entries()),
      trustScores: Array.from(this.trustScores.entries()),
      behaviorHistory: Array.from(this.behaviorHistory.entries()).map(([k, v]) => [k, v.slice(-100)]),
      adaptationLog: this.adaptationLog.slice(-1000),
      exportedAt: Date.now()
    };
  }

  /**
   * Import adaptix state
   */
  importState(state) {
    try {
      this.userProfiles = new Map(state.userProfiles || []);
      this.trustScores = new Map(state.trustScores || []);
      this.behaviorHistory = new Map(state.behaviorHistory || []);
      this.adaptationLog = state.adaptationLog || [];

      logger.info('Adaptix state imported successfully');
    } catch (error) {
      logger.error('Failed to import Adaptix state', { error });
    }
  }

  /**
   * Simple event emitter
   */
  emit(event, data) {
    const handlerName = `on${event.charAt(0).toUpperCase() + event.slice(1)}`;
    if (typeof this[handlerName] === 'function') {
      this[handlerName](data);
    }
  }
}

export default Adaptix;
