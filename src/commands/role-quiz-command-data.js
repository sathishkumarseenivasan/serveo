const { SlashCommandBuilder } = require('discord.js');

module.exports = new SlashCommandBuilder()
    .setName('role-quiz')
    .setDescription('🎯 AI generates an interactive quiz to help members discover their perfect roles')
    .addStringOption(option =>
        option.setName('category')
            .setDescription('Type of roles to create quiz for (e.g., "game-roles", "skill-roles", "interest-roles")')
            .setRequired(true)
    )
    .addChannelOption(option =>
        option.setName('channel')
            .setDescription('Channel to post the quiz in (defaults to current channel)')
            .setRequired(false)
    );
