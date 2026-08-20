const { ChannelType, PermissionFlagsBits } = require('discord.js');

/**
 * Creates categories and channels based on AI-generated plan
 * @param {object} guild - Discord Guild object
 * @param {array} categories - Array of category plans from AI
 * @returns {Promise<object>} - Created channels mapped by name
 */
async function createCategoriesAndChannels(guild, categories) {
    const createdChannels = {};
    
    for (const categoryPlan of categories) {
        try {
            // Create category
            const category = await guild.channels.create({
                name: categoryPlan.name,
                type: ChannelType.GuildCategory,
            });
            
            console.log(`Created category: ${categoryPlan.name}`);
            
            // Create channels in this category
            if (categoryPlan.channels && categoryPlan.channels.length > 0) {
                for (const channelPlan of categoryPlan.channels) {
                    try {
                        const channelType = channelPlan.type === 'voice' 
                            ? ChannelType.GuildVoice 
                            : ChannelType.GuildText;
                        
                        const channelOptions = {
                            name: channelPlan.name,
                            type: channelType,
                            parent: category.id,
                        };
                        
                        if (channelPlan.topic && channelType === ChannelType.GuildText) {
                            channelOptions.topic = channelPlan.topic;
                        }
                        
                        const channel = await guild.channels.create(channelOptions);
                        createdChannels[channelPlan.name] = channel;
                        
                        console.log(`Created channel: ${channelPlan.name} in ${categoryPlan.name}`);
                    } catch (error) {
                        console.error(`Failed to create channel ${channelPlan.name}:`, error.message);
                    }
                }
            }
        } catch (error) {
            console.error(`Failed to create category ${categoryPlan.name}:`, error.message);
        }
    }
    
    return createdChannels;
}

/**
 * Applies permission overwrites to channels
 * @param {object} channel - Discord Channel object
 * @param {array} permissionRules - Array of permission rules from AI
 * @param {object} roleMap - Map of role names to Discord Role objects
 */
async function applyChannelPermissions(channel, permissionRules, roleMap) {
    const relevantRules = permissionRules.filter(rule => rule.channel === channel.name);
    
    for (const rule of relevantRules) {
        const role = roleMap[rule.role];
        if (!role) {
            console.warn(`Role "${rule.role}" not found for permission rule`);
            continue;
        }
        
        try {
            const allowBits = new Set();
            const denyBits = new Set();
            
            // Convert permission strings to bits
            if (rule.allow) {
                for (const perm of rule.allow) {
                    if (PermissionFlagsBits[perm]) {
                        allowBits.add(PermissionFlagsBits[perm]);
                    }
                }
            }
            
            if (rule.deny) {
                for (const perm of rule.deny) {
                    if (PermissionFlagsBits[perm]) {
                        denyBits.add(PermissionFlagsBits[perm]);
                    }
                }
            }
            
            await channel.permissionOverwrites.edit(role, {
                add: Array.from(allowBits),
                deny: Array.from(denyBits),
            });
            
            console.log(`Applied permissions for ${role.name} on ${channel.name}`);
        } catch (error) {
            console.error(`Failed to apply permissions for ${role.name} on ${channel.name}:`, error.message);
        }
    }
}

module.exports = {
    createCategoriesAndChannels,
    applyChannelPermissions,
};
