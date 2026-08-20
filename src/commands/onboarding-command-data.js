const { SlashCommandBuilder } = require('discord.js');

module.exports = new SlashCommandBuilder()
    .setName('onboarding')
    .setDescription('👋 AI creates a personalized onboarding experience for new members')
    .addStringOption(option =>
        option.setName('server-type')
            .setDescription('Type of server (e.g., "gaming", "study", "art", "crypto")')
            .setRequired(true)
    )
    .addChannelOption(option =>
        option.setName('welcome-channel')
            .setDescription('Channel where welcome messages will be posted')
            .setRequired(false)
    );
