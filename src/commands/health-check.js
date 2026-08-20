const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { analyzeServerHealth } = require('../ai/advanced-features');

async function healthCheckCommand(interaction) {
    await interaction.deferReply({ ephemeral: false });
    
    const focus = interaction.options.getString('focus') || 'comprehensive';
    const guild = interaction.guild;
    
    try {
        await interaction.followUp({ 
            content: '🧠 AI is analyzing your server health...', 
            ephemeral: false 
        });
        
        // Gather basic activity data (simplified - in production you'd fetch real message counts)
        const channels = await guild.channels.fetch();
        const recentActivity = [];
        
        for (const [channelId, channel] of channels) {
            if (channel.isTextBased()) {
                // In production, fetch actual message counts from the last 24h
                recentActivity.push({
                    channel: channel.name,
                    count: Math.floor(Math.random() * 100) // Placeholder
                });
            }
        }
        
        // Get AI analysis
        const healthReport = await analyzeServerHealth(guild, recentActivity);
        
        // Create rich embed for the report
        const embed = new EmbedBuilder()
            .setColor(healthReport.healthScore >= 70 ? 0x00FF00 : healthReport.healthScore >= 40 ? 0xFFFF00 : 0xFF0000)
            .setTitle('🏥 Server Health Report')
            .setDescription(`**Overall Health Score: ${healthReport.healthScore}/100**`)
            .addFields(
                {
                    name: '✅ Strengths',
                    value: healthReport.strengths.slice(0, 3).map(s => `• ${s}`).join('\n') || 'No specific strengths identified',
                    inline: false
                },
                {
                    name: '⚠️ Areas for Improvement',
                    value: healthReport.weaknesses.slice(0, 3).map(w => `• ${w}`).join('\n') || 'Looking good!',
                    inline: false
                }
            )
            .setFooter({ text: `Analysis for ${guild.name}` })
            .setTimestamp();
        
        // Add high-priority recommendations
        const highPriorityRecs = healthReport.recommendations.filter(r => r.priority === 'high');
        if (highPriorityRecs.length > 0) {
            embed.addFields({
                name: '🔴 High Priority Actions',
                value: highPriorityRecs.slice(0, 3).map(r => `• **${r.category}**: ${r.action}`).join('\n'),
                inline: false
            });
        }
        
        // Add suggested channels
        if (healthReport.suggestedChannels && healthReport.suggestedChannels.length > 0) {
            embed.addFields({
                name: '💡 Suggested New Channels',
                value: healthReport.suggestedChannels.slice(0, 5).map(c => `• ${c}`).join('\n'),
                inline: true
            });
        }
        
        // Add engagement tips
        if (healthReport.engagementTips && healthReport.engagementTips.length > 0) {
            embed.addFields({
                name: '📈 Quick Engagement Tips',
                value: healthReport.engagementTips.slice(0, 3).map(t => `• ${t}`).join('\n'),
                inline: true
            });
        }
        
        await interaction.followUp({ 
            embeds: [embed],
            ephemeral: false 
        });
        
        // Send detailed recommendations as a follow-up if there are many
        if (healthReport.recommendations.length > 3) {
            const detailedEmbed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle('📋 All Recommendations')
                .setDescription(healthReport.recommendations.map((r, i) => 
                    `**${i + 1}. ${r.priority === 'high' ? '🔴' : r.priority === 'medium' ? '🟡' : '🟢'} ${r.action}**\n*Expected Impact: ${r.expectedImpact}*`
                ).join('\n\n'))
                .setFooter({ text: `Total recommendations: ${healthReport.recommendations.length}` })
                .setTimestamp();
            
            await interaction.followUp({ 
                embeds: [detailedEmbed],
                ephemeral: true 
            });
        }
        
    } catch (error) {
        console.error('Error in health-check command:', error);
        await interaction.followUp({ 
            content: `❌ Error analyzing server health: ${error.message}`, 
            ephemeral: true 
        });
    }
}

module.exports = { healthCheckCommand };
