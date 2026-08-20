const { analyzePermissions } = require('../ai/server-analyzer');
const { applyPermissions, PERMISSION_MAP } = require('../builders/role-builder');

async function permissionsCommand(interaction) {
    await interaction.deferReply({ ephemeral: false });
    
    const prompt = interaction.options.getString('prompt');
    const guild = interaction.guild;
    
    try {
        await interaction.followUp({ 
            content: '🧠 Analyzing permission request...', 
            ephemeral: false 
        });
        
        // Get current server structure
        const channels = await guild.channels.fetch();
        const roles = await guild.roles.fetch();
        
        const existingStructure = {
            channels: channels.map(ch => ({ name: ch.name, type: ch.type })),
            roles: roles.map(r => ({ name: r.name })),
        };
        
        // Get AI analysis
        const permissionsPlan = await analyzePermissions(prompt, existingStructure);
        
        if (!permissionsPlan.permissions || permissionsPlan.permissions.length === 0) {
            await interaction.followUp({ 
                content: '❌ No permission changes were suggested by the AI. Try a different description.', 
                ephemeral: true 
            });
            return;
        }
        
        // Build role map
        const roleMap = {};
        for (const [roleId, role] of roles) {
            roleMap[role.name] = role;
        }
        
        // Build channel map
        const channelMap = {};
        for (const [channelId, channel] of channels) {
            channelMap[channel.name] = channel;
        }
        
        await interaction.followUp({ 
            content: `✅ Found ${permissionsPlan.permissions.length} permission rules to apply.\n\n🔨 Applying permissions now...`, 
            ephemeral: false 
        });
        
        // Apply permissions
        await applyPermissions(guild, permissionsPlan.permissions, roleMap, channelMap);
        
        await interaction.followUp({ 
            content: `✅ Successfully applied ${permissionsPlan.permissions.length} permission rules!`, 
            ephemeral: false 
        });
        
    } catch (error) {
        console.error('Error in permissions command:', error);
        await interaction.followUp({ 
            content: `❌ Error applying permissions: ${error.message}`, 
            ephemeral: true 
        });
    }
}

module.exports = { permissionsCommand };
