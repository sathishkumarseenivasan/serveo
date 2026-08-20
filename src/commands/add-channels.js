const { analyzeChannelsToAdd } = require('../ai/server-analyzer');
const { createCategoriesAndChannels } = require('../builders/channel-builder');

async function addChannelsCommand(interaction) {
    await interaction.deferReply({ ephemeral: false });
    
    const prompt = interaction.options.getString('prompt');
    const guild = interaction.guild;
    
    try {
        await interaction.followUp({ 
            content: '🧠 Analyzing channel request...', 
            ephemeral: false 
        });
        
        // Get current server structure
        const existingCategories = await guild.channels.fetch();
        const categoryNames = existingCategories
            .filter(ch => ch.type === 4) // GuildCategory
            .map(ch => ch.name);
        
        const existingStructure = { categories: categoryNames.map(name => ({ name })) };
        
        // Get AI analysis
        const channelsPlan = await analyzeChannelsToAdd(prompt, existingStructure);
        
        if (!channelsPlan.categories || channelsPlan.categories.length === 0) {
            await interaction.followUp({ 
                content: '❌ No channels were suggested by the AI. Try a different description.', 
                ephemeral: true 
            });
            return;
        }
        
        await interaction.followUp({ 
            content: `✅ Found ${channelsPlan.categories.length} categories with channels to add.\n\n🔨 Creating channels now...`, 
            ephemeral: false 
        });
        
        // Create channels
        const createdChannels = await createCategoriesAndChannels(guild, channelsPlan.categories);
        
        await interaction.followUp({ 
            content: `✅ Successfully created ${Object.keys(createdChannels).length} new channels!`, 
            ephemeral: false 
        });
        
    } catch (error) {
        console.error('Error in add-channels command:', error);
        await interaction.followUp({ 
            content: `❌ Error adding channels: ${error.message}`, 
            ephemeral: true 
        });
    }
}

module.exports = { addChannelsCommand };
