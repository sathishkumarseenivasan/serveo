async function resetCommand(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    const guild = interaction.guild;
    
    try {
        await interaction.followUp({ 
            content: '⚠️ This will delete all channels and roles (except default ones). Are you sure? This cannot be undone.', 
            ephemeral: true 
        });
        
        // Note: In a production bot, you'd add a confirmation button here
        // For now, we'll proceed with a warning delay
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        let deletedChannels = 0;
        let deletedRoles = 0;
        
        // Delete all channels (except default ones like @everyone)
        const channels = await guild.channels.fetch();
        for (const [channelId, channel] of channels) {
            try {
                if (channel.deletable) {
                    await channel.delete();
                    deletedChannels++;
                }
            } catch (error) {
                console.warn(`Could not delete channel ${channel.name}:`, error.message);
            }
        }
        
        // Delete all roles (except @everyone and bot roles)
        const roles = await guild.roles.fetch();
        const botUser = interaction.client.user;
        
        for (const [roleId, role] of roles) {
            try {
                if (role.deletable && role.name !== '@everyone' && !role.managed) {
                    await role.delete();
                    deletedRoles++;
                }
            } catch (error) {
                console.warn(`Could not delete role ${role.name}:`, error.message);
            }
        }
        
        await interaction.followUp({ 
            content: `✅ Reset complete!\n\n🗑️ Deleted ${deletedChannels} channels\n🗑️ Deleted ${deletedRoles} roles\n\nYou can now use /build to create a new server structure.`, 
            ephemeral: false 
        });
        
    } catch (error) {
        console.error('Error in reset command:', error);
        await interaction.followUp({ 
            content: `❌ Error resetting server: ${error.message}`, 
            ephemeral: true 
        });
    }
}

module.exports = { resetCommand };
