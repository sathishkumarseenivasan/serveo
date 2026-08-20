const { analyzeRolesToCreate } = require('../ai/server-analyzer');
const { createRoles } = require('../builders/role-builder');

async function createRolesCommand(interaction) {
    await interaction.deferReply({ ephemeral: false });
    
    const prompt = interaction.options.getString('prompt');
    const guild = interaction.guild;
    
    try {
        await interaction.followUp({ 
            content: '🧠 Analyzing role request...', 
            ephemeral: false 
        });
        
        // Get AI analysis
        const rolesPlan = await analyzeRolesToCreate(prompt);
        
        if (!rolesPlan.roles || rolesPlan.roles.length === 0) {
            await interaction.followUp({ 
                content: '❌ No roles were suggested by the AI. Try a different description.', 
                ephemeral: true 
            });
            return;
        }
        
        await interaction.followUp({ 
            content: `✅ Found ${rolesPlan.roles.length} roles to create.\n\n🔨 Creating roles now...`, 
            ephemeral: false 
        });
        
        // Create roles
        const createdRoles = await createRoles(guild, rolesPlan.roles);
        
        await interaction.followUp({ 
            content: `✅ Successfully created ${Object.keys(createdRoles).length} new roles!`, 
            ephemeral: false 
        });
        
    } catch (error) {
        console.error('Error in create-roles command:', error);
        await interaction.followUp({ 
            content: `❌ Error creating roles: ${error.message}`, 
            ephemeral: true 
        });
    }
}

module.exports = { createRolesCommand };
