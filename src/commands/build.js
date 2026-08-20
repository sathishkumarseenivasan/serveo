const { SlashCommandBuilder } = require('discord.js');
const { analyzeServerRequest } = require('../ai/server-analyzer');
const { createCategoriesAndChannels } = require('../builders/channel-builder');
const { createRoles, applyPermissions } = require('../builders/role-builder');

async function buildCommand(interaction) {
    await interaction.deferReply({ ephemeral: false });
    
    const description = interaction.options.getString('description');
    const guild = interaction.guild;
    
    try {
        await interaction.followUp({ 
            content: '🧠 Analyzing your request and designing server structure...', 
            ephemeral: false 
        });
        
        // Get AI analysis
        const serverPlan = await analyzeServerRequest(description);
        
        await interaction.followUp({ 
            content: `✅ Server plan generated!\n\n📁 Categories: ${serverPlan.categories?.length || 0}\n👥 Roles: ${serverPlan.roles?.length || 0}\n🔐 Permission rules: ${serverPlan.permissions?.length || 0}\n\n🔨 Building your server now...`, 
            ephemeral: false 
        });
        
        // Create roles first (needed for permissions)
        let roleMap = {};
        if (serverPlan.roles && serverPlan.roles.length > 0) {
            await interaction.followUp({ content: '👥 Creating roles...', ephemeral: false });
            roleMap = await createRoles(guild, serverPlan.roles);
        }
        
        // Create categories and channels
        let channelMap = {};
        if (serverPlan.categories && serverPlan.categories.length > 0) {
            await interaction.followUp({ content: '📁 Creating categories and channels...', ephemeral: false });
            channelMap = await createCategoriesAndChannels(guild, serverPlan.categories);
        }
        
        // Apply permissions
        if (serverPlan.permissions && serverPlan.permissions.length > 0 && Object.keys(roleMap).length > 0) {
            await interaction.followUp({ content: '🔐 Applying permissions...', ephemeral: false });
            await applyPermissions(guild, serverPlan.permissions, roleMap, channelMap);
        }
        
        // Summary
        const summary = [
            '🎉 **Server Build Complete!**',
            '',
            `✅ Created ${Object.keys(channelMap).length} channels`,
            `✅ Created ${Object.keys(roleMap).length} roles`,
            `✅ Applied ${serverPlan.permissions?.length || 0} permission rules`,
            '',
            'Your server is now ready to use!',
        ].join('\n');
        
        await interaction.followUp({ content: summary, ephemeral: false });
        
    } catch (error) {
        console.error('Error in build command:', error);
        await interaction.followUp({ 
            content: `❌ Error building server: ${error.message}`, 
            ephemeral: true 
        });
    }
}

module.exports = { buildCommand };
