const Anthropic = require('anthropic');
require('dotenv').config();

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Uses AI to reason about server structure based on user description
 * @param {string} description - User's description of the server they want
 * @returns {Promise<object>} - Structured server plan with categories, channels, roles, and permissions
 */
async function analyzeServerRequest(description) {
    const prompt = `You are an expert Discord server architect. Analyze this request and create a comprehensive server structure plan.

User Request: "${description}"

Create a JSON response with the following structure:
{
    "categories": [
        {
            "name": "Category Name",
            "channels": [
                {
                    "name": "channel-name",
                    "type": "text" | "voice",
                    "topic": "Channel description/topic"
                }
            ]
        }
    ],
    "roles": [
        {
            "name": "Role Name",
            "color": "#HEXCOLOR",
            "hoist": true/false,
            "mentionable": true/false,
            "permissions": ["permission1", "permission2"]
        }
    ],
    "permissions": [
        {
            "channel": "channel-name",
            "role": "role-name",
            "allow": ["VIEW_CHANNEL", "SEND_MESSAGES"],
            "deny": []
        }
    ]
}

Guidelines:
- Create logical categories based on the server purpose
- Include essential channels (welcome, rules, general chat, etc.)
- Create appropriate roles with hierarchy (Admin, Moderator, Member, etc.)
- Set up sensible permissions for each channel/role combination
- Consider private channels for staff, VIP areas, etc.
- Use appropriate channel types (text/voice)

Respond ONLY with valid JSON, no additional text.`;

    try {
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
        });

        const content = response.content[0].text;
        
        // Extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in AI response');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Error analyzing server request:', error);
        throw error;
    }
}

/**
 * Analyzes a prompt to suggest additional channels
 * @param {string} prompt - User's description of channels to add
 * @param {object} existingStructure - Current server structure
 * @returns {Promise<object>} - Channels to add
 */
async function analyzeChannelsToAdd(prompt, existingStructure) {
    const systemContext = `Current server has these categories: ${existingStructure.categories?.map(c => c.name).join(', ') || 'none'}`;
    
    const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemContext,
        messages: [{ 
            role: 'user', 
            content: `Based on this request: "${prompt}", suggest channels to add. Return JSON with categories and channels only.` 
        }],
    });

    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
        return { categories: [] };
    }

    return JSON.parse(jsonMatch[0]);
}

/**
 * Analyzes a prompt to suggest roles
 * @param {string} prompt - User's description of roles to create
 * @returns {Promise<object>} - Roles to create
 */
async function analyzeRolesToCreate(prompt) {
    const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{ 
            role: 'user', 
            content: `Based on this request: "${prompt}", suggest roles to create. Return JSON with roles array only.` 
        }],
    });

    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
        return { roles: [] };
    }

    return JSON.parse(jsonMatch[0]);
}

/**
 * Analyzes permission configuration requests
 * @param {string} prompt - User's description of permission changes
 * @param {object} existingStructure - Current server structure
 * @returns {Promise<object>} - Permission updates
 */
async function analyzePermissions(prompt, existingStructure) {
    const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{ 
            role: 'user', 
            content: `Based on this request: "${prompt}", suggest permission changes. Return JSON with permissions array only.` 
        }],
    });

    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
        return { permissions: [] };
    }

    return JSON.parse(jsonMatch[0]);
}

module.exports = {
    analyzeServerRequest,
    analyzeChannelsToAdd,
    analyzeRolesToCreate,
    analyzePermissions,
};
