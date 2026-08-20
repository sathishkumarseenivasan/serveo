const { SlashCommandBuilder } = require('discord.js');

module.exports = new SlashCommandBuilder()
    .setName('health-check')
    .setDescription('🏥 AI analyzes your server health and provides improvement recommendations')
    .addStringOption(option =>
        option.setName('focus')
            .setDescription('Specific area to focus on (optional)')
            .setRequired(false)
            .addChoices(
                { name: 'Engagement', value: 'engagement' },
                { name: 'Structure', value: 'structure' },
                { name: 'Moderation', value: 'moderation' },
                { name: 'Growth', value: 'growth' },
                { name: 'All Areas', value: 'comprehensive' }
            )
    );
