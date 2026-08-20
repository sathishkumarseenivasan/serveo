const { REST, Routes } = require('discord.js');
require('dotenv').config();

const buildCommandData = require('../commands/build-command-data');
const addChannelsCommandData = require('../commands/add-channels-command-data');
const createRolesCommandData = require('../commands/create-roles-command-data');
const permissionsCommandData = require('../commands/permissions-command-data');
const resetCommandData = require('../commands/reset-command-data');
const healthCheckCommandData = require('../commands/health-check-command-data');
const roleQuizCommandData = require('../commands/role-quiz-command-data');
const eventPlannerCommandData = require('../commands/event-planner-command-data');
const onboardingCommandData = require('../commands/onboarding-command-data');

const commands = [
    buildCommandData,
    addChannelsCommandData,
    createRolesCommandData,
    permissionsCommandData,
    resetCommandData,
    healthCheckCommandData,
    roleQuizCommandData,
    eventPlannerCommandData,
    onboardingCommandData,
];

async function deployCommands() {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    try {
        console.log('Started refreshing application (/) commands.');
        
        // Register commands globally
        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
            { body: commands }
        );
        
        console.log('Successfully reloaded application (/) commands.');
        console.log(`Deployed ${commands.length} commands including 4 unique AI-powered features!`);
    } catch (error) {
        console.error('Error deploying commands:', error);
    }
}

deployCommands();
