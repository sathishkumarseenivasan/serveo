const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { generateOnboardingFlow } = require('../ai/advanced-features');

async function onboardingCommand(interaction) {
    await interaction.deferReply({ ephemeral: false });
    
    const serverType = interaction.options.getString('server-type');
    const welcomeChannel = interaction.options.getChannel('welcome-channel') || interaction.channel;
    const guild = interaction.guild;
    
    try {
        await interaction.followUp({ 
            content: '🧠 AI is designing a personalized onboarding experience...', 
            ephemeral: false 
        });
        
        // Gather server channels and roles
        const channels = await guild.channels.fetch();
        const roles = await guild.roles.fetch();
        
        const serverChannels = channels
            .filter(c => c.isTextBased())
            .map(c => ({ name: c.name, description: c.topic || '' }));
        
        const serverRoles = roles
            .filter(r => !r.managed && r.name !== '@everyone')
            .map(r => ({ name: r.name }));
        
        // Generate onboarding flow
        const onboardingData = await generateOnboardingFlow(serverType, serverChannels, serverRoles);
        
        // Create welcome message embed
        const welcomeEmbed = new EmbedBuilder()
            .setColor(parseInt(onboardingData.welcomeMessage.embedColor.replace('#', ''), 16) || 0x5865F2)
            .setTitle(`👋 ${onboardingData.welcomeMessage.title}`)
            .setDescription(onboardingData.welcomeMessage.content.replace('{username}', '@NewMember'))
            .setThumbnail(guild.iconURL())
            .setFooter({ text: 'Welcome to our community!' })
            .setTimestamp();
        
        await interaction.followUp({ 
            content: `✨ **Custom Onboarding Flow Created!**\n\nThis onboarding experience is tailored for your **${serverType}** server.`,
            embeds: [welcomeEmbed],
            ephemeral: false 
        });
        
        // Send onboarding steps guide
        const stepsEmbed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('📍 New Member Journey')
            .setDescription('Step-by-step guide for new members:')
            .addFields(onboardingData.onboardingSteps.map((step, i) => ({
                name: `Step ${step.step}: ${step.title}`,
                value: `${step.description}\n*💡 Tip: ${step.tip}*`,
                inline: false
            })))
            .setFooter({ text: `${onboardingData.onboardingSteps.length} steps to get started` });
        
        await interaction.followUp({ 
            embeds: [stepsEmbed],
            ephemeral: false 
        });
        
        // Send role suggestions
        if (onboardingData.roleSuggestions) {
            const rolesEmbed = new EmbedBuilder()
                .setColor(0x9B59B6)
                .setTitle('🎭 Recommended Roles')
                .addFields(
                    {
                        name: '✅ Essential Roles',
                        value: onboardingData.roleSuggestions.required.map(r => `• ${r}`).join('\n') || 'None specified',
                        inline: true
                    }
                );
            
            if (onboardingData.roleSuggestions.optional && onboardingData.roleSuggestions.optional.length > 0) {
                rolesEmbed.addFields({
                    name: '⭐ Optional Roles',
                    value: onboardingData.roleSuggestions.optional.slice(0, 5).map(r => `• **${r.role}** - ${r.for}\n_How: ${r.how}_`).join('\n\n'),
                    inline: false
                });
            }
            
            await interaction.followUp({ 
                embeds: [rolesEmbed],
                ephemeral: false 
            });
        }
        
        // Send channel guide
        if (onboardingData.channelGuide && onboardingData.channelGuide.length > 0) {
            const essentialChannels = onboardingData.channelGuide.filter(c => c.priority === 'essential');
            const recommendedChannels = onboardingData.channelGuide.filter(c => c.priority === 'recommended');
            
            const channelsEmbed = new EmbedBuilder()
                .setColor(0x2ECC71)
                .setTitle('📺 Channel Guide')
                .setDescription('Help new members navigate your server!');
            
            if (essentialChannels.length > 0) {
                channelsEmbed.addFields({
                    name: '🔴 Essential Channels',
                    value: essentialChannels.map(c => `• <#${c.channel}> - ${c.purpose}\n${c.tips.map(t => `_ ${t}`).join('\n') || ''}`).join('\n\n').substring(0, 1024),
                    inline: false
                });
            }
            
            if (recommendedChannels.length > 0) {
                channelsEmbed.addFields({
                    name: '🟡 Recommended Channels',
                    value: recommendedChannels.slice(0, 5).map(c => `• <#${c.channel}> - ${c.purpose}`).join('\n').substring(0, 1024),
                    inline: false
                });
            }
            
            await interaction.followUp({ 
                embeds: [channelsEmbed],
                ephemeral: false 
            });
        }
        
        // Send FAQ
        if (onboardingData.faq && onboardingData.faq.length > 0) {
            const faqEmbed = new EmbedBuilder()
                .setColor(0xF39C12)
                .setTitle('❓ Frequently Asked Questions')
                .setDescription(onboardingData.faq.slice(0, 10).map((faq, i) => 
                    `**Q${i + 1}: ${faq.question}**\nA: ${faq.answer}`
                ).join('\n\n'))
                .setFooter({ text: 'Keep this handy for new members!' });
            
            await interaction.followUp({ 
                embeds: [faqEmbed],
                ephemeral: true 
            });
        }
        
        // Send first week goals
        if (onboardingData.firstWeekGoals && onboardingData.firstWeekGoals.length > 0) {
            const goalsEmbed = new EmbedBuilder()
                .setColor(0xE74C3C)
                .setTitle('🎯 First Week Goals for New Members')
                .setDescription(onboardingData.firstWeekGoals.map((goal, i) => `${i + 1}. ${goal}`).join('\n'))
                .setFooter({ text: 'Encourage new members to complete these!' });
            
            await interaction.followUp({ 
                embeds: [goalsEmbed],
                ephemeral: true 
            });
        }
        
        // Provide setup instructions for moderators
        const setupEmbed = new EmbedBuilder()
            .setColor(0x95A5A6)
            .setTitle('⚙️ Setup Instructions for Moderators')
            .setDescription(`To implement this onboarding flow:\n\n1. **Welcome Channel**: Set up <#${welcomeChannel.id}> for welcome messages\n2. **Auto-responses**: Configure the bot to send these messages when members join\n3. **Role Reactions**: Set up reaction roles based on the suggested roles\n4. **Channel Permissions**: Ensure new members can access essential channels\n5. **Welcome Message**: Use the generated template with {username} placeholder\n\n**Pro Tip**: Pin this message or save it in your mod documentation!`)
            .setFooter({ text: 'Generated by Serveo Bot AI' });
        
        await interaction.followUp({ 
            embeds: [setupEmbed],
            ephemeral: true 
        });
        
    } catch (error) {
        console.error('Error in onboarding command:', error);
        await interaction.followUp({ 
            content: `❌ Error creating onboarding flow: ${error.message}`, 
            ephemeral: true 
        });
    }
}

module.exports = { onboardingCommand };
