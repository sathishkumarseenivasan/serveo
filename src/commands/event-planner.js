const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { generateEventIdeas } = require('../ai/advanced-features');

async function eventPlannerCommand(interaction) {
    await interaction.deferReply({ ephemeral: false });
    
    const eventType = interaction.options.getString('type') || 'community building';
    const frequency = interaction.options.getString('frequency') || 'any';
    const guild = interaction.guild;
    
    try {
        await interaction.followUp({ 
            content: '🧠 AI is brainstorming creative event ideas for your community...', 
            ephemeral: false 
        });
        
        // Gather server data
        const serverData = {
            memberCount: guild.memberCount,
            activeMembers: Math.floor(guild.memberCount * 0.3), // Estimate
            timezones: ['UTC', 'EST', 'PST'], // In production, analyze member timezones
            existingEvents: [] // In production, fetch from event bot or database
        };
        
        // Determine server type from name or categories
        let serverType = 'general community';
        if (guild.name.toLowerCase().includes('game')) serverType = 'gaming';
        else if (guild.name.toLowerCase().includes('art')) serverType = 'art';
        else if (guild.name.toLowerCase().includes('study') || guild.name.toLowerCase().includes('school')) serverType = 'education';
        else if (guild.name.toLowerCase().includes('crypto') || guild.name.toLowerCase().includes('trading')) serverType = 'finance';
        else if (guild.name.toLowerCase().includes('music')) serverType = 'music';
        else if (guild.name.toLowerCase().includes('tech') || guild.name.toLowerCase().includes('code')) serverType = 'technology';
        
        // Generate event ideas
        const eventData = await generateEventIdeas(serverType, serverData);
        
        // Create main events embed
        const mainEmbed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle(`🎉 Event Ideas for ${guild.name}`)
            .setDescription(`Generated **${eventData.eventIdeas.length}** creative event ideas tailored for your ${serverType} community!`)
            .setThumbnail(guild.iconURL())
            .setFooter({ text: `Server Size: ${guild.memberCount} members` })
            .setTimestamp();
        
        // Add top 3 event ideas
        const topEvents = eventData.eventIdeas.slice(0, 3);
        mainEmbed.addFields({
            name: '🌟 Top Recommended Events',
            value: topEvents.map((event, i) => 
                `**${i + 1}. ${event.name}**\n${event.description.substring(0, 100)}...\n*Difficulty: ${event.difficulty} | Engagement: ${event.engagementPotential}*`
            ).join('\n\n'),
            inline: false
        });
        
        await interaction.followUp({ 
            embeds: [mainEmbed],
            ephemeral: false 
        });
        
        // Send detailed next event plan
        if (eventData.nextEventPlan) {
            const planEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle(`📋 Ready-to-Run: ${eventData.nextEventPlan.recommendedEvent}`)
                .setDescription('Complete planning guide for your next event!')
                .addFields(
                    {
                        name: '📅 Timeline',
                        value: [
                            `**Announce:** ${eventData.nextEventPlan.timeline.announcement}`,
                            `**Registration:** ${eventData.nextEventPlan.timeline.registration}`,
                            `**Event Date:** ${eventData.nextEventPlan.timeline.event}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '✅ Preparation Checklist',
                        value: eventData.nextEventPlan.checklist.slice(0, 5).map(task => `• ${task}`).join('\n') || 'No specific tasks',
                        inline: true
                    }
                );
            
            if (eventData.nextEventPlan.announcementTemplate) {
                planEmbed.addFields({
                    name: '📢 Announcement Draft',
                    value: `\`\`\`${eventData.nextEventPlan.announcementTemplate.substring(0, 1000)}\`\`\``,
                    inline: false
                });
            }
            
            await interaction.followUp({ 
                embeds: [planEmbed],
                ephemeral: false 
            });
        }
        
        // Send all event ideas as a list
        if (eventData.eventIdeas.length > 3) {
            const allEventsEmbed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle('🎪 All Event Ideas')
                .setDescription(eventData.eventIdeas.map((event, i) => 
                    `**${i + 1}. ${event.name}** (${event.type})\n${event.description}\n*Duration: ${event.duration} | Best Time: ${event.idealTime || 'Flexible'}*`
                ).join('\n\n'))
                .setFooter({ text: `${eventData.eventIdeas.length} total event ideas generated` });
            
            await interaction.followUp({ 
                embeds: [allEventsEmbed],
                ephemeral: true 
            });
        }
        
        // Send seasonal suggestions
        if (eventData.seasonalSuggestions && eventData.seasonalSuggestions.length > 0) {
            const seasonalEmbed = new EmbedBuilder()
                .setColor(0xFF6B6B)
                .setTitle('🗓️ Upcoming Seasonal Events')
                .setDescription(eventData.seasonalSuggestions.map(s => `• ${s}`).join('\n'))
                .setFooter({ text: 'Plan ahead for maximum participation!' });
            
            await interaction.followUp({ 
                embeds: [seasonalEmbed],
                ephemeral: true 
            });
        }
        
    } catch (error) {
        console.error('Error in event-planner command:', error);
        await interaction.followUp({ 
            content: `❌ Error generating event ideas: ${error.message}`, 
            ephemeral: true 
        });
    }
}

module.exports = { eventPlannerCommand };
