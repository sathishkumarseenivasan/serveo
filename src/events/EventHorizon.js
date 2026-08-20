/**
 * EventHorizon - Intelligent event scheduling and prediction system
 * Uses AI to predict optimal event times, types, and engagement strategies
 * 
 * Features:
 * - Optimal time prediction based on member activity patterns
 * - Event type recommendation engine
 * - Automated reminder scheduling
 * - Post-event analysis and learning
 */

import { CronJob } from 'cron';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/event-horizon.log' })
  ]
});

class EventHorizon {
  constructor(config = {}) {
    this.config = config;
    this.events = new Map();
    this.eventHistory = [];
    this.memberActivityPatterns = new Map();
    this.optimalTimeCache = new Map();
    this.reminderJobs = new Map();
    
    this.startActivityTracking();
  }

  /**
   * Create a new scheduled event
   */
  async createEvent(eventData) {
    const eventId = uuidv4();
    const event = {
      id: eventId,
      ...eventData,
      status: 'scheduled',
      createdAt: Date.now(),
      remindersSent: [],
      attendees: new Set(),
      maybeAttendees: new Set(),
      engagement: {
        views: 0,
        reactions: 0,
        comments: 0
      }
    };

    // Predict optimal time if not specified
    if (!event.scheduledTime && eventData.guildId) {
      event.scheduledTime = await this.predictOptimalTime(eventData.guildId, eventData.duration);
      event.timePredicted = true;
    }

    // Predict event type success probability
    event.successProbability = await this.calculateSuccessProbability(event);

    this.events.set(eventId, event);
    this.scheduleReminders(event);

    logger.info('Event created', { eventId, name: event.name, scheduledTime: event.scheduledTime });
    return event;
  }

  /**
   * Predict optimal event time based on member activity
   */
  async predictOptimalTime(guildId, duration = 60) {
    const cacheKey = `${guildId}_${duration}`;
    const cached = this.optimalTimeCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour cache
      return cached.time;
    }

    const activityPattern = this.memberActivityPatterns.get(guildId) || await this.fetchActivityPattern(guildId);
    
    if (!activityPattern || activityPattern.length === 0) {
      // Default to weekend evening
      const defaultTime = this.getDefaultOptimalTime();
      this.optimalTimeCache.set(cacheKey, { time: defaultTime, timestamp: Date.now() });
      return defaultTime;
    }

    // Find peak activity window
    const peakWindow = this.findPeakActivityWindow(activityPattern, duration);
    const optimalTime = this.calculateOptimalDateTime(peakWindow);

    this.optimalTimeCache.set(cacheKey, { time: optimalTime, timestamp: Date.now() });
    return optimalTime;
  }

  /**
   * Fetch activity pattern for a guild
   */
  async fetchActivityPattern(guildId) {
    // This would integrate with Discord API to get real activity data
    // For now, return simulated pattern
    const pattern = [];
    const now = new Date();
    
    for (let i = 0; i < 7; i++) { // Last 7 days
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      
      pattern.push({
        date: day.toDateString(),
        hours: this.generateDailyActivity(day.getDay())
      });
    }

    this.memberActivityPatterns.set(guildId, pattern);
    return pattern;
  }

  /**
   * Generate simulated daily activity pattern
   */
  generateDailyActivity(dayOfWeek) {
    const hours = new Array(24).fill(0);
    
    // Higher activity on weekends
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseMultiplier = isWeekend ? 1.5 : 1.0;
    
    // Peak hours: 6 PM - 10 PM
    for (let hour = 0; hour < 24; hour++) {
      let activity = 0.2; // Base activity
      
      if (hour >= 18 && hour <= 22) {
        activity = 0.8 * baseMultiplier; // Peak hours
      } else if (hour >= 12 && hour <= 14) {
        activity = 0.5 * baseMultiplier; // Lunch break
      } else if (hour >= 22 && hour <= 24) {
        activity = 0.4 * baseMultiplier; // Late night
      }
      
      // Add some randomness
      activity *= (0.8 + Math.random() * 0.4);
      hours[hour] = activity;
    }

    return hours;
  }

  /**
   * Find peak activity window for given duration
   */
  findPeakActivityWindow(pattern, duration) {
    const hourlyTotals = new Array(24).fill(0);
    
    // Aggregate activity across all days by hour
    pattern.forEach(day => {
      day.hours.forEach((activity, hour) => {
        hourlyTotals[hour] += activity;
      });
    });

    // Find best consecutive window
    const durationHours = Math.ceil(duration / 60);
    let bestStart = 18; // Default to 6 PM
    let bestScore = 0;

    for (let start = 0; start < 24; start++) {
      let score = 0;
      for (let i = 0; i < durationHours; i++) {
        const hour = (start + i) % 24;
        score += hourlyTotals[hour];
      }

      if (score > bestScore) {
        bestScore = score;
        bestStart = start;
      }
    }

    return { startHour: bestStart, score: bestScore };
  }

  /**
   * Calculate optimal datetime from peak window
   */
  calculateOptimalDateTime(peakWindow) {
    const now = new Date();
    const nextOccurrence = new Date(now);
    
    // Set to peak hour
    nextOccurrence.setHours(peakWindow.startHour, 0, 0, 0);
    
    // If today's peak has passed, schedule for next occurrence
    if (nextOccurrence < now) {
      nextOccurrence.setDate(nextOccurrence.getDate() + 1);
    }

    // Prefer weekends if close
    const dayOfWeek = nextOccurrence.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const daysToWeekend = (6 - dayOfWeek + 7) % 7;
      if (daysToWeekend <= 2) {
        nextOccurrence.setDate(nextOccurrence.getDate() + daysToWeekend);
      }
    }

    return nextOccurrence.toISOString();
  }

  /**
   * Get default optimal time
   */
  getDefaultOptimalTime() {
    const now = new Date();
    const nextSaturday = new Date(now);
    nextSaturday.setDate(nextSaturday.getDate() + (6 - nextSaturday.getDay() + 7) % 7);
    nextSaturday.setHours(19, 0, 0, 0); // 7 PM
    
    if (nextSaturday < now) {
      nextSaturday.setDate(nextSaturday.getDate() + 7);
    }
    
    return nextSaturday.toISOString();
  }

  /**
   * Calculate event success probability
   */
  async calculateSuccessProbability(event) {
    let probability = 0.5; // Base probability

    // Time optimization factor
    if (event.timePredicted) {
      probability += 0.15;
    }

    // Day of week factor
    const eventDate = new Date(event.scheduledTime);
    const dayOfWeek = eventDate.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday or Saturday
      probability += 0.1;
    }

    // Duration factor (1-2 hours is optimal)
    const durationHours = (event.duration || 60) / 60;
    if (durationHours >= 1 && durationHours <= 2) {
      probability += 0.1;
    } else if (durationHours > 3) {
      probability -= 0.1; // Too long
    }

    // Event type factor
    const popularTypes = ['game-night', 'movie', 'trivia', 'community-meetup', 'workshop'];
    if (popularTypes.includes(event.type)) {
      probability += 0.1;
    }

    return Math.min(Math.max(probability, 0), 1);
  }

  /**
   * Schedule event reminders
   */
  scheduleReminders(event) {
    const reminderTimes = [
      24 * 60 * 60 * 1000, // 24 hours before
      1 * 60 * 60 * 1000,  // 1 hour before
      15 * 60 * 1000       // 15 minutes before
    ];

    const eventTime = new Date(event.scheduledTime).getTime();

    reminderTimes.forEach((delay, index) => {
      const reminderTime = eventTime - delay;
      const now = Date.now();

      if (reminderTime > now) {
        const jobId = `${event.id}_reminder_${index}`;
        
        const job = new CronJob(new Date(reminderTime), () => {
          this.sendReminder(event, index);
        });

        job.start();
        this.reminderJobs.set(jobId, job);

        logger.debug('Reminder scheduled', { eventId: event.id, delay, jobId });
      }
    });
  }

  /**
   * Send event reminder
   */
  async sendReminder(event, reminderIndex) {
    const reminderMessages = [
      `📅 Reminder: ${event.name} is tomorrow at ${new Date(event.scheduledTime).toLocaleTimeString()}!`,
      `⏰ ${event.name} starts in 1 hour! Don't miss out!`,
      `🚀 ${event.name} is starting in 15 minutes! Join us soon!`
    ];

    event.remindersSent.push({
      index: reminderIndex,
      sentAt: Date.now(),
      message: reminderMessages[reminderIndex]
    });

    logger.info('Event reminder sent', { eventId: event.id, reminderIndex });
    
    // Emit event for actual Discord message sending
    this.emit('reminder', { event, message: reminderMessages[reminderIndex] });
  }

  /**
   * RSVP to event
   */
  rsvp(eventId, userId, status = 'attending') {
    const event = this.events.get(eventId);
    if (!event) {
      logger.warn('Event not found for RSVP', { eventId });
      return false;
    }

    // Remove from other lists first
    event.attendees.delete(userId);
    event.maybeAttendees.delete(userId);

    // Add to appropriate list
    if (status === 'attending') {
      event.attendees.add(userId);
    } else if (status === 'maybe') {
      event.maybeAttendees.add(userId);
    }

    logger.debug('RSVP recorded', { eventId, userId, status });
    return true;
  }

  /**
   * Record event engagement
   */
  recordEngagement(eventId, type, value = 1) {
    const event = this.events.get(eventId);
    if (!event) return;

    if (event.engagement[type] !== undefined) {
      event.engagement[type] += value;
    }

    logger.debug('Engagement recorded', { eventId, type, value });
  }

  /**
   * Complete event and analyze results
   */
  async completeEvent(eventId, actualAttendance = null) {
    const event = this.events.get(eventId);
    if (!event) return null;

    event.status = 'completed';
    event.completedAt = Date.now();
    event.actualAttendance = actualAttendance || event.attendees.size;

    // Calculate success metrics
    event.metrics = {
      attendanceRate: event.actualAttendance / Math.max(event.attendees.size, 1),
      engagementScore: (
        event.engagement.views * 0.1 +
        event.engagement.reactions * 0.3 +
        event.engagement.comments * 0.6
      ),
      successVsPrediction: event.actualAttendance / (event.attendees.size * event.successProbability || 1)
    };

    // Store in history
    this.eventHistory.push({
      ...event,
      attendees: Array.from(event.attendees),
      maybeAttendees: Array.from(event.maybeAttendees)
    });

    // Clean up reminders
    this.cleanupReminders(eventId);

    // Learn from results
    await this.learnFromEvent(event);

    logger.info('Event completed', { eventId, attendance: event.actualAttendance });
    return event;
  }

  /**
   * Learn from completed event
   */
  async learnFromEvent(event) {
    // Adjust time prediction algorithm based on success
    if (event.metrics.attendanceRate > 0.8) {
      // Similar events at this time worked well
      logger.debug('Positive learning signal', { eventId: event.id });
    } else if (event.metrics.attendanceRate < 0.3) {
      // Poor attendance - adjust future predictions
      logger.debug('Negative learning signal', { eventId: event.id });
    }

    // Update activity patterns
    const eventDate = new Date(event.scheduledTime);
    const hour = eventDate.getHours();
    const dayOfWeek = eventDate.getDay();

    // This would update the activity pattern model
    // For now, just log the learning opportunity
    logger.info('Learning opportunity identified', {
      eventId: event.id,
      hour,
      dayOfWeek,
      attendanceRate: event.metrics.attendanceRate
    });
  }

  /**
   * Clean up reminder jobs for completed event
   */
  cleanupReminders(eventId) {
    for (const [jobId, job] of this.reminderJobs.entries()) {
      if (jobId.startsWith(eventId)) {
        job.stop();
        this.reminderJobs.delete(jobId);
      }
    }
  }

  /**
   * Get upcoming events
   */
  getUpcomingEvents(limit = 10) {
    const now = Date.now();
    const upcoming = Array.from(this.events.values())
      .filter(e => e.status === 'scheduled' && new Date(e.scheduledTime).getTime() > now)
      .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime))
      .slice(0, limit);

    return upcoming;
  }

  /**
   * Get event statistics
   */
  getStats() {
    const completed = this.eventHistory.filter(e => e.status === 'completed');
    
    return {
      totalEvents: this.events.size + this.eventHistory.length,
      scheduledEvents: Array.from(this.events.values()).filter(e => e.status === 'scheduled').length,
      completedEvents: completed.length,
      averageAttendance: completed.length > 0
        ? completed.reduce((sum, e) => sum + (e.actualAttendance || 0), 0) / completed.length
        : 0,
      averageAttendanceRate: completed.length > 0
        ? completed.reduce((sum, e) => sum + (e.metrics?.attendanceRate || 0), 0) / completed.length
        : 0,
      activeReminders: this.reminderJobs.size,
      trackedGuilds: this.memberActivityPatterns.size
    };
  }

  /**
   * Start activity tracking cron job
   */
  startActivityTracking() {
    // Run every hour to update activity patterns
    const trackingJob = new CronJob('0 * * * *', () => {
      this.updateActivityPatterns();
    });

    trackingJob.start();
    logger.info('Event Horizon activity tracking started');
  }

  /**
   * Update activity patterns
   */
  async updateActivityPatterns() {
    // This would fetch fresh activity data from Discord
    // For now, just refresh the cache periodically
    this.optimalTimeCache.clear();
    logger.debug('Activity patterns refreshed');
  }

  /**
   * Export event horizon state
   */
  exportState() {
    return {
      events: Array.from(this.events.entries()).map(([k, v]) => [
        k,
        { ...v, attendees: Array.from(v.attendees), maybeAttendees: Array.from(v.maybeAttendees) }
      ]),
      eventHistory: this.eventHistory,
      activityPatterns: Array.from(this.memberActivityPatterns.entries()),
      exportedAt: Date.now()
    };
  }

  /**
   * Import event horizon state
   */
  importState(state) {
    try {
      state.events.forEach(([k, v]) => {
        v.attendees = new Set(v.attendees);
        v.maybeAttendees = new Set(v.maybeAttendees);
        this.events.set(k, v);
      });

      this.eventHistory = state.eventHistory || [];
      this.memberActivityPatterns = new Map(state.activityPatterns || []);

      // Reschedule reminders for upcoming events
      this.events.forEach((event, eventId) => {
        if (event.status === 'scheduled') {
          this.scheduleReminders(event);
        }
      });

      logger.info('Event Horizon state imported successfully');
    } catch (error) {
      logger.error('Failed to import Event Horizon state', { error });
    }
  }

  /**
   * Simple event emitter implementation
   */
  emit(event, data) {
    const handlerName = `on${event.charAt(0).toUpperCase() + event.slice(1)}`;
    if (typeof this[handlerName] === 'function') {
      this[handlerName](data);
    }
  }
}

export default EventHorizon;
