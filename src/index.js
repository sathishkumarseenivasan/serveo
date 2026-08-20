/**
 * Serveo Bot Neural - AI-Powered Discord Server Builder
 * Enhanced with Neural Core Framework for self-learning and adaptation
 */

import { Client, GatewayIntentBits, Events } from 'discord.js';
import dotenv from 'dotenv';
import NeuralCore from './core/NeuralCore.js';
import MemoryPalace from './memory/MemoryPalace.js';
import EventHorizon from './events/EventHorizon.js';
import Adaptix from './adapters/Adaptix.js';

dotenv.config();

// Import commands
import { buildCommand } from './commands/build.js';
import { addChannelsCommand } from './commands/add-channels.js';
import { createRolesCommand } from './commands/create-roles.js';
import { permissionsCommand } from './commands/permissions.js';
import { resetCommand } from './commands/reset.js';
import { healthCheckCommand } from './commands/health-check.js';
import { roleQuizCommand } from './commands/role-quiz.js';
import { eventPlannerCommand } from './commands/event-planner.js';
import { onboardingCommand } from './commands/onboarding.js';

// Initialize core systems
const neuralCore = new NeuralCore({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  learningRate: 0.1,
  confidenceThreshold: 0.75
});

const memoryPalace = new MemoryPalace({
  cacheTTL: 3600,
  memoryDecay: 0.95,
  maxNodes: 10000
});

const eventHorizon = new EventHorizon({});

const adaptix = new Adaptix({});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

// Track user activity for Adaptix
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  
  // Record positive message behavior
  adaptix.recordBehavior(message.author.id, {
    type: 'positive_message',
    channelId: message.channel.id,
    guildId: message.guild?.id
  });

  // Update profile stats
  const profile = adaptix.userProfiles.get(message.author.id);
  if (profile) {
    profile.messageCount = (profile.messageCount || 0) + 1;
    profile.lastActiveAt = Date.now();
  }
});

// Track reactions for trust scoring
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (user.bot) return;
  
  const emoji = reaction.emoji.name;
  const isPositive = ['👍', '❤️', '😊', '🎉', '⭐'].includes(emoji);
  const isNegative = ['👎', '😡', '💩'].includes(emoji);
  
  if (isPositive) {
    adaptix.recordBehavior(reaction.message.author.id, {
      type: 'received_reaction_positive',
      emoji
    });
  } else if (isNegative) {
    adaptix.recordBehavior(reaction.message.author.id, {
      type: 'received_reaction_negative',
      emoji
    });
  }
});

client.once('ready', async () => {
    console.log(`Serveo Bot Neural is ready! Logged in as ${client.user.tag}`);
    console.log('');
    console.log('🧠 Neural Core Framework Active:');
    console.log('  - Self-learning AI with confidence scoring');
    console.log('  - Graph-based memory system (Memory Palace)');
    console.log('  - Predictive event scheduling (Event Horizon)');
    console.log('  - Adaptive permissions (Adaptix)');
    console.log('');
    console.log('✨ Commands Available:');
    console.log('  /build - AI server generation');
    console.log('  /add-channels - AI channel planning');
    console.log('  /create-roles - Smart role creation');
    console.log('  /permissions - AI permission logic');
    console.log('  /reset - Clear generated structures');
    console.log('  /health-check - Server health analysis');
    console.log('  /role-quiz - Interactive role quizzes');
    console.log('  /event-planner - AI event planning');
    console.log('  /onboarding - Personalized onboarding');
    console.log('');
    console.log('📊 System Statistics:');
    console.log(`  Neural Decisions: ${neuralCore.decisionHistory.length}`);
    console.log(`  Memory Nodes: ${memoryPalace.graph.order}`);
    console.log(`  Tracked Users: ${adaptix.userProfiles.size}`);
    
    // Store memory palace reference globally for commands
    client.memoryPalace = memoryPalace;
    client.neuralCore = neuralCore;
    client.eventHorizon = eventHorizon;
    client.adaptix = adaptix;
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    try {
        switch (interaction.commandName) {
            case 'build':
                await buildCommand(interaction);
                break;
            case 'add-channels':
                await addChannelsCommand(interaction);
                break;
            case 'create-roles':
                await createRolesCommand(interaction);
                break;
            case 'permissions':
                await permissionsCommand(interaction);
                break;
            case 'reset':
                await resetCommand(interaction);
                break;
            case 'health-check':
                await healthCheckCommand(interaction);
                break;
            case 'role-quiz':
                await roleQuizCommand(interaction);
                break;
            case 'event-planner':
                await eventPlannerCommand(interaction);
                break;
            case 'onboarding':
                await onboardingCommand(interaction);
                break;
            default:
                console.log(`Unknown command: ${interaction.commandName}`);
        }
    } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        const errorMessage = { content: '❌ An error occurred while executing this command.', ephemeral: true };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  
  // Export state from all systems
  const state = {
    neuralCore: neuralCore.exportState(),
    memoryPalace: memoryPalace.exportState(),
    eventHorizon: eventHorizon.exportState(),
    adaptix: adaptix.exportState(),
    exportedAt: Date.now()
  };
  
  console.log('System state exported (would be saved to database in production)');
  
  await client.destroy();
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
