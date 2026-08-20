const Anthropic = require('anthropic');
require('dotenv').config();

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Analyzes server activity and suggests improvements
 * @param {object} guild - Discord Guild object
 * @param {array} recentMessages - Recent message activity data
 * @returns {Promise<object>} - Improvement suggestions
 */
async function analyzeServerHealth(guild, recentMessages = []) {
    const prompt = `You are an expert Discord community analyst. Analyze this server data and provide actionable improvement suggestions.

Server Info:
- Name: ${guild.name}
- Member Count: ${guild.memberCount}
- Channel Count: ${guild.channels.cache.size}
- Role Count: ${guild.roles.cache.size}

Recent Activity Summary:
${recentMessages.length > 0 
    ? recentMessages.map(m => `- ${m.channel}: ${m.count} messages in last 24h`).join('\n')
    : 'No recent activity data provided'}

Provide a JSON response with this structure:
{
    "healthScore": 0-100,
    "strengths": ["list of server strengths"],
    "weaknesses": ["list of areas needing improvement"],
    "recommendations": [
        {
            "priority": "high" | "medium" | "low",
            "category": "engagement" | "structure" | "moderation" | "growth",
            "action": "specific actionable recommendation",
            "expectedImpact": "description of expected improvement"
        }
    ],
    "suggestedChannels": ["new channels that would benefit this server"],
    "suggestedEvents": ["event ideas for this community"],
    "engagementTips": ["tips to boost member engagement"]
}

Be specific and actionable. Consider the server size and apparent purpose.`;

    try {
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
        });

        const content = response.content[0].text;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            throw new Error('No valid JSON found in AI response');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Error analyzing server health:', error);
        throw error;
    }
}

/**
 * Generates a custom quiz for role assignment based on interests/skills
 * @param {string} roleType - Type of role (e.g., "game roles", "skill roles")
 * @param {array} availableRoles - List of available roles to assign
 * @returns {Promise<object>} - Quiz questions and role mapping
 */
async function generateRoleQuiz(roleType, availableRoles) {
    const prompt = `You are creating an engaging quiz to help Discord members self-assign roles.

Role Category: ${roleType}
Available Roles: ${availableRoles.join(', ')}

Create a fun, insightful quiz that helps users discover which roles fit them best.

Return JSON with this structure:
{
    "quizTitle": "Engaging quiz title",
    "description": "Brief description of what the quiz does",
    "questions": [
        {
            "question": "The question text",
            "type": "multiple_choice" | "scale" | "scenario",
            "options": [
                {
                    "text": "Option text",
                    "scores": {
                        "RoleName1": 2,
                        "RoleName2": 1,
                        "RoleName3": 0
                    }
                }
            ]
        }
    ],
    "roleMapping": {
        "minScores": {
            "RoleName1": 5,
            "RoleName2": 3
        },
        "instructions": "How to interpret scores"
    },
    "embedColor": "#HEXCOLOR"
}

Make questions engaging and relevant to the role category. Include 5-7 questions.`;

    try {
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
        });

        const content = response.content[0].text;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            throw new Error('No valid JSON found in AI response');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Error generating role quiz:', error);
        throw error;
    }
}

/**
 * Analyzes channel activity and suggests archival candidates
 * @param {array} channels - Array of channel data with activity metrics
 * @returns {Promise<object>} - Channels recommended for archival
 */
async function suggestChannelArchival(channels) {
    const prompt = `You are a Discord server optimization expert. Analyze channel activity and recommend which channels should be archived.

Channel Data (name, type, age_days, messages_last_30_days, unique_participants):
${channels.map(c => `- ${c.name}: ${c.type}, ${c.age_days} days old, ${c.messages_last_30_days} messages, ${c.unique_participants} participants`).join('\n')}

Consider:
- Channels with very low activity relative to server size
- Duplicate or redundant channels
- Channels that served a temporary purpose
- Seasonal or event-specific channels that are no longer relevant

Return JSON with this structure:
{
    "archivalCandidates": [
        {
            "channel": "channel-name",
            "reason": "detailed explanation why this should be archived",
            "confidence": 0-100,
            "alternativeAction": "merge with X" | "rename to Y" | "keep but pin important messages" | null,
            "importantContent": "whether there's important content to preserve"
        }
    ],
    "channelsToKeep": [
        {
            "channel": "channel-name",
            "reason": "why this channel should remain active"
        }
    ],
    "suggestedMergers": [
        {
            "channels": ["channel1", "channel2"],
            "proposedName": "merged-channel-name",
            "reason": "why these should be merged"
        }
    ],
    "summary": "Overall assessment of channel organization"
}

Be conservative - only suggest archival when clearly justified.`;

    try {
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
        });

        const content = response.content[0].text;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            throw new Error('No valid JSON found in AI response');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Error suggesting channel archival:', error);
        throw error;
    }
}

/**
 * Generates conflict resolution suggestions for reported disputes
 * @param {string} disputeDescription - Description of the conflict
 * @param {string} serverRules - Server rules context
 * @returns {Promise<object>} - Resolution suggestions
 */
async function suggestConflictResolution(disputeDescription, serverRules) {
    const prompt = `You are a neutral Discord community mediator. Help resolve this dispute fairly.

Server Rules:
${serverRules || 'No specific rules provided'}

Dispute Description:
${disputeDescription}

Provide fair, balanced mediation suggestions that:
- Consider all perspectives
- Reference applicable rules
- Suggest de-escalation techniques
- Recommend appropriate consequences if rules were broken
- Focus on community health over punishment

Return JSON with this structure:
{
    "assessment": {
        "severity": "low" | "medium" | "high" | "critical",
        "ruleViolations": ["list of potentially violated rules"],
        "contextFactors": ["important contextual considerations"]
    },
    "resolutionSteps": [
        {
            "step": 1,
            "action": "specific action for moderators",
            "target": "user1" | "user2" | "both" | "channel" | "community",
            "rationale": "why this step is recommended"
        }
    ],
    "suggestedMessages": {
        "toUser1": "calm, professional message to send to first party",
        "toUser2": "calm, professional message to send to second party",
        "publicStatement": "optional public message if needed"
    },
    "preventiveMeasures": ["steps to prevent similar conflicts"],
    "followUpActions": ["actions to take after resolution"]
}

Remain neutral and focus on restorative rather than punitive approaches when appropriate.`;

    try {
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
        });

        const content = response.content[0].text;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            throw new Error('No valid JSON found in AI response');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Error suggesting conflict resolution:', error);
        throw error;
    }
}

/**
 * Generates community event ideas and planning assistance
 * @param {string} serverType - Type of server (gaming, study, art, etc.)
 * @param {object} serverData - Server statistics and member info
 * @returns {Promise<object>} - Event suggestions and plans
 */
async function generateEventIdeas(serverType, serverData) {
    const prompt = `You are a creative Discord community event planner. Generate engaging event ideas for this server.

Server Type: ${serverType}
Server Stats:
- Members: ${serverData.memberCount}
- Active Members (weekly): ${serverData.activeMembers || 'unknown'}
- Timezones: ${serverData.timezones?.join(', ') || 'mixed'}
- Existing Events: ${serverData.existingEvents?.join(', ') || 'none'}

Create diverse event ideas suitable for this community. Include both one-time and recurring events.

Return JSON with this structure:
{
    "eventIdeas": [
        {
            "name": "Event Name",
            "type": "one-time" | "recurring",
            "frequency": "daily" | "weekly" | "monthly" | null,
            "description": "What this event involves",
            "duration": "estimated duration",
            "preparationNeeded": ["tasks to prepare"],
            "rolesRequired": ["roles needed to run this"],
            "idealTime": "best time to host considering timezones",
            "engagementPotential": "high" | "medium" | "low",
            "difficulty": "easy" | "medium" | "hard"
        }
    ],
    "nextEventPlan": {
        "recommendedEvent": "which event to run next",
        "timeline": {
            "announcement": "when to announce",
            "registration": "registration period",
            "event": "event date/time"
        },
        "checklist": ["pre-event tasks"],
        "announcementTemplate": "draft announcement message",
        "reminderSchedule": ["when to send reminders"]
    },
    "seasonalSuggestions": ["events tied to upcoming holidays/seasons"]
}

Prioritize events that build community and are sustainable to run regularly.`;

    try {
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
        });

        const content = response.content[0].text;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            throw new Error('No valid JSON found in AI response');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Error generating event ideas:', error);
        throw error;
    }
}

/**
 * Creates personalized onboarding flows for new members
 * @param {string} serverType - Type of server
 * @param {array} serverChannels - Available channels
 * @param {array} serverRoles - Available roles
 * @returns {Promise<object>} - Onboarding flow configuration
 */
async function generateOnboardingFlow(serverType, serverChannels, serverRoles) {
    const prompt = `You are a Discord community onboarding specialist. Create a welcoming, informative onboarding experience.

Server Type: ${serverType}
Available Channels: ${serverChannels.map(c => `${c.name} (${c.description || 'no description'})`).join(', ')}
Available Roles: ${serverRoles.map(r => r.name).join(', ')}

Design an onboarding flow that:
- Welcomes new members warmly
- Helps them understand the server purpose
- Guides them to relevant channels
- Suggests appropriate roles
- Sets clear expectations
- Encourages participation

Return JSON with this structure:
{
    "welcomeMessage": {
        "title": "Welcome message title",
        "content": "Personalized welcome message template (use {username} placeholder)",
        "embedColor": "#HEXCOLOR",
        "thumbnail": "whether to include server icon",
        "reactions": ["emoji reactions to add for quick actions"]
    },
    "onboardingSteps": [
        {
            "step": 1,
            "title": "Step title",
            "description": "What the user should do",
            "channel": "suggested channel to visit",
            "action": "read" | "react" | "introduce" | "select-role" | "explore",
            "tip": "helpful tip for this step"
        }
    ],
    "roleSuggestions": {
        "required": ["roles everyone should have"],
        "optional": [
            {
                "role": "role-name",
                "for": "who should get this",
                "how": "how to obtain it"
            }
        ]
    },
    "channelGuide": [
        {
            "channel": "channel-name",
            "purpose": "what this channel is for",
            "priority": "essential" | "recommended" | "optional",
            "tips": ["usage tips"]
        }
    ],
    "firstWeekGoals": ["suggested activities for new members"],
    "faq": [
        {
            "question": "Common question",
            "answer": "Clear answer"
        }
    ]
}

Make the tone friendly and inviting while being informative.`;

    try {
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
        });

        const content = response.content[0].text;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            throw new Error('No valid JSON found in AI response');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Error generating onboarding flow:', error);
        throw error;
    }
}

/**
 * Generates custom auto-moderation policies based on server needs
 * @param {string} serverType - Type of server
 * @param {string} communityValues - Stated community values/goals
 * @returns {Promise<object>} - Moderation policy configuration
 */
async function generateModerationPolicy(serverType, communityValues) {
    const prompt = `You are a Discord safety and moderation expert. Create comprehensive auto-moderation policies.

Server Type: ${serverType}
Community Values: ${communityValues || 'Safe, welcoming, inclusive community'}

Create balanced moderation policies that protect the community while allowing genuine interaction.

Return JSON with this structure:
{
    "policyName": "Custom policy name",
    "version": "1.0",
    "corePrinciples": ["guiding principles for moderation"],
    "autoModRules": [
        {
            "name": "Rule name",
            "trigger": "what triggers this rule",
            "keywords": ["example keywords/patterns"],
            "regexPatterns": ["regex patterns if applicable"],
            "action": "block" | "alert" | "timeout" | "review",
            "duration": "timeout duration if applicable",
            "exemptions": ["roles exempt from this rule"],
            "appealProcess": "how to appeal"
        }
    ],
    "escalationMatrix": [
        {
            "offense": "type of violation",
            "firstStrike": "consequence",
            "secondStrike": "consequence",
            "thirdStrike": "consequence"
        }
    ],
    "manualReviewTriggers": ["situations requiring human moderator review"],
    "appealsProcess": {
        "method": "how to appeal",
        "responseTime": "expected response time",
        "considerations": ["what is considered in appeals"]
    },
    "moderatorGuidelines": [
        {
            "situation": "common scenario",
            "recommendedAction": "how to handle it",
            "notes": "additional guidance"
        }
    ],
    "transparencyReport": {
        "enabled": true,
        "metrics": ["what to track and report monthly"]
    }
}

Balance safety with freedom. Avoid over-moderation while ensuring community safety.`;

    try {
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
        });

        const content = response.content[0].text;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            throw new Error('No valid JSON found in AI response');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Error generating moderation policy:', error);
        throw error;
    }
}

/**
 * Analyzes conversation sentiment and provides insights
 * @param {array} messages - Recent messages with content and metadata
 * @returns {Promise<object>} - Sentiment analysis and insights
 */
async function analyzeConversationSentiment(messages) {
    const prompt = `You are a Discord community sentiment analyst. Analyze these recent messages and provide insights.

Recent Messages (format: username: content):
${messages.slice(0, 50).map(m => `- ${m.author}: ${m.content.substring(0, 100)}`).join('\n')}

Analyze the overall sentiment, identify emerging topics, detect potential issues, and provide actionable insights.

Return JSON with this structure:
{
    "overallSentiment": {
        "score": -10 to 10,
        "label": "very negative" | "negative" | "neutral" | "positive" | "very positive",
        "confidence": 0-100
    },
    "emotionBreakdown": {
        "joy": percentage,
        "anger": percentage,
        "sadness": percentage,
        "excitement": percentage,
        "frustration": percentage,
        "other": percentage
    },
    "trendingTopics": [
        {
            "topic": "what people are discussing",
            "sentiment": "positive" | "neutral" | "negative",
            "messageCount": number,
            "keyParticipants": ["active discussants"]
        }
    ],
    "potentialIssues": [
        {
            "issue": "description of potential problem",
            "severity": "low" | "medium" | "high",
            "evidence": ["relevant message excerpts"],
            "recommendedAction": "what moderators should do"
        }
    ],
    "positiveHighlights": ["positive moments or interactions to celebrate"],
    "engagementMetrics": {
        "activeParticipants": number,
        "lurkersEngaged": number,
        "averageMessageLength": number,
        "questionRate": percentage
    },
    "recommendations": ["actions to improve community health"]
}

Be nuanced in your analysis. Consider context and sarcasm where possible.`;

    try {
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
        });

        const content = response.content[0].text;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            throw new Error('No valid JSON found in AI response');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Error analyzing sentiment:', error);
        throw error;
    }
}

module.exports = {
    analyzeServerHealth,
    generateRoleQuiz,
    suggestChannelArchival,
    suggestConflictResolution,
    generateEventIdeas,
    generateOnboardingFlow,
    generateModerationPolicy,
    analyzeConversationSentiment,
};
