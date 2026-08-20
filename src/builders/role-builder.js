const { PermissionFlagsBits } = require('discord.js');

// Map of permission names to Discord permission bits
const PERMISSION_MAP = {
    'ADMINISTRATOR': PermissionFlagsBits.Administrator,
    'MANAGE_GUILD': PermissionFlagsBits.ManageGuild,
    'MANAGE_CHANNELS': PermissionFlagsBits.ManageChannels,
    'MANAGE_ROLES': PermissionFlagsBits.ManageRoles,
    'MANAGE_MESSAGES': PermissionFlagsBits.ManageMessages,
    'VIEW_CHANNEL': PermissionFlagsBits.ViewChannel,
    'SEND_MESSAGES': PermissionFlagsBits.SendMessages,
    'SEND_TTS_MESSAGES': PermissionFlagsBits.SendTTSMessages,
    'MANAGE_WEBHOOKS': PermissionFlagsBits.ManageWebhooks,
    'EMBED_LINKS': PermissionFlagsBits.EmbedLinks,
    'ATTACH_FILES': PermissionFlagsBits.AttachFiles,
    'READ_MESSAGE_HISTORY': PermissionFlagsBits.ReadMessageHistory,
    'MENTION_EVERYONE': PermissionFlagsBits.MentionEveryone,
    'USE_EXTERNAL_EMOJIS': PermissionFlagsBits.UseExternalEmojis,
    'ADD_REACTIONS': PermissionFlagsBits.AddReactions,
    'CONNECT': PermissionFlagsBits.Connect,
    'SPEAK': PermissionFlagsBits.Speak,
    'MUTE_MEMBERS': PermissionFlagsBits.MuteMembers,
    'DEAFEN_MEMBERS': PermissionFlagsBits.DeafenMembers,
    'MOVE_MEMBERS': PermissionFlagsBits.MoveMembers,
    'USE_VAD': PermissionFlagsBits.UseVAD,
    'CHANGE_NICKNAME': PermissionFlagsBits.ChangeNickname,
    'MANAGE_NICKNAMES': PermissionFlagsBits.ManageNicknames,
    'KICK_MEMBERS': PermissionFlagsBits.KickMembers,
    'BAN_MEMBERS': PermissionFlagsBits.BanMembers,
    'MODERATE_MEMBERS': PermissionFlagsBits.ModerateMembers,
};

/**
 * Creates roles based on AI-generated plan
 * @param {object} guild - Discord Guild object
 * @param {array} roles - Array of role plans from AI
 * @returns {Promise<object>} - Created roles mapped by name
 */
async function createRoles(guild, roles) {
    const createdRoles = {};
    
    // Sort roles by hierarchy (roles with more permissions first)
    const sortedRoles = [...roles].sort((a, b) => {
        const aPerms = a.permissions?.length || 0;
        const bPerms = b.permissions?.length || 0;
        return bPerms - aPerms;
    });
    
    for (const rolePlan of sortedRoles) {
        try {
            // Convert permission strings to bitfield
            let permissions = 0n;
            if (rolePlan.permissions && rolePlan.permissions.length > 0) {
                for (const perm of rolePlan.permissions) {
                    if (PERMISSION_MAP[perm]) {
                        permissions |= PERMISSION_MAP[perm];
                    }
                }
            }
            
            // Parse color
            let color = null;
            if (rolePlan.color) {
                color = parseInt(rolePlan.color.replace('#', ''), 16);
            }
            
            const roleOptions = {
                name: rolePlan.name,
                permissions: permissions,
                hoist: rolePlan.hoist ?? false,
                mentionable: rolePlan.mentionable ?? false,
            };
            
            if (color) {
                roleOptions.color = color;
            }
            
            const role = await guild.roles.create(roleOptions);
            createdRoles[rolePlan.name] = role;
            
            console.log(`Created role: ${rolePlan.name}`);
        } catch (error) {
            console.error(`Failed to create role ${rolePlan.name}:`, error.message);
        }
    }
    
    return createdRoles;
}

/**
 * Applies permission overwrites to all channels based on rules
 * @param {object} guild - Discord Guild object
 * @param {array} permissionRules - Array of permission rules from AI
 * @param {object} roleMap - Map of role names to Discord Role objects
 * @param {object} channelMap - Map of channel names to Discord Channel objects
 */
async function applyPermissions(guild, permissionRules, roleMap, channelMap) {
    const channels = await guild.channels.fetch();
    
    for (const [channelId, channel] of channels) {
        if (!channel.isTextBased() && channel.type !== 0) continue; // Skip non-text channels
        
        const channelName = channel.name;
        const relevantRules = permissionRules.filter(rule => 
            rule.channel === channelName || rule.channel === '*'
        );
        
        for (const rule of relevantRules) {
            const role = roleMap[rule.role];
            if (!role) {
                console.warn(`Role "${rule.role}" not found for permission rule`);
                continue;
            }
            
            try {
                const allowBits = [];
                const denyBits = [];
                
                // Convert permission strings to bits
                if (rule.allow) {
                    for (const perm of rule.allow) {
                        if (PERMISSION_MAP[perm]) {
                            allowBits.push(PERMISSION_MAP[perm]);
                        }
                    }
                }
                
                if (rule.deny) {
                    for (const perm of rule.deny) {
                        if (PERMISSION_MAP[perm]) {
                            denyBits.push(PERMISSION_MAP[perm]);
                        }
                    }
                }
                
                await channel.permissionOverwrites.edit(role, {
                    add: allowBits,
                    deny: denyBits,
                });
                
                console.log(`Applied permissions for ${role.name} on ${channel.name}`);
            } catch (error) {
                console.error(`Failed to apply permissions for ${role.name} on ${channel.name}:`, error.message);
            }
        }
    }
}

module.exports = {
    createRoles,
    applyPermissions,
    PERMISSION_MAP,
};
