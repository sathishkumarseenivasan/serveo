const { SlashCommandBuilder } = require('discord.js');

module.exports = new SlashCommandBuilder()
    .setName('event-planner')
    .setDescription('🎉 AI generates creative community event ideas with complete planning guides')
    .addStringOption(option =>
        option.setName('type')
            .setDescription('Type of event you want (e.g., "game night", "art contest", "AMA session")')
            .setRequired(false)
    )
    .addStringOption(option =>
        option.setName('frequency')
            .setDescription('Preferred event frequency')
            .setRequired(false)
            .addChoices(
                { name: 'One-time Event', value: 'one-time' },
                { name: 'Weekly', value: 'weekly' },
                { name: 'Monthly', value: 'monthly' },
                { name: 'Any', value: 'any' }
            )
    );
