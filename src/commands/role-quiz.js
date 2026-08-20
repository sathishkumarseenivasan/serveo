const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { generateRoleQuiz } = require('../ai/advanced-features');

async function roleQuizCommand(interaction) {
    await interaction.deferReply({ ephemeral: false });
    
    const category = interaction.options.getString('category');
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
    const guild = interaction.guild;
    
    try {
        await interaction.followUp({ 
            content: '🧠 AI is generating a custom role quiz...', 
            ephemeral: false 
        });
        
        // Get existing roles that might match the category
        const allRoles = await guild.roles.fetch();
        const relevantRoles = allRoles
            .filter(role => !role.managed && role.name !== '@everyone')
            .map(role => role.name);
        
        // Generate the quiz
        const quizData = await generateRoleQuiz(category, relevantRoles);
        
        // Create the quiz embed
        const quizEmbed = new EmbedBuilder()
            .setColor(parseInt(quizData.embedColor.replace('#', ''), 16) || 0x5865F2)
            .setTitle(`🎯 ${quizData.quizTitle}`)
            .setDescription(quizData.description)
            .setFooter({ text: `Answer all questions to discover your perfect roles!` })
            .setTimestamp();
        
        // Send the quiz introduction
        await interaction.followUp({ 
            content: `✨ **Interactive Role Quiz Created!**\n\n${quizEmbed.description}\n\n**How it works:** Answer the questions below and I'll suggest the perfect roles for you!`,
            embeds: [quizEmbed],
            ephemeral: false 
        });
        
        // Send each question as a separate interactive message
        for (let i = 0; i < quizData.questions.length; i++) {
            const question = quizData.questions[i];
            
            const questionEmbed = new EmbedBuilder()
                .setColor(parseInt(quizData.embedColor.replace('#', ''), 16) || 0x5865F2)
                .setTitle(`Question ${i + 1}/${quizData.questions.length}`)
                .setDescription(question.question)
                .setFooter({ text: `${category} quiz` });
            
            // Create buttons for multiple choice options
            if (question.type === 'multiple_choice' && question.options.length <= 5) {
                const buttons = question.options.map((opt, idx) => 
                    new ButtonBuilder()
                        .setCustomId(`quiz_${interaction.id}_${i}_${idx}`)
                        .setLabel(opt.text.substring(0, 80))
                        .setStyle(ButtonStyle.Primary)
                );
                
                const row = new ActionRowBuilder().addComponents(buttons);
                
                await targetChannel.send({
                    embeds: [questionEmbed],
                    components: [row]
                });
            } else {
                // For scale or scenario questions, just send as text
                if (question.options) {
                    const optionsText = question.options.map((opt, idx) => 
                        `**${String.fromCharCode(65 + idx)})** ${opt.text}`
                    ).join('\n');
                    
                    await targetChannel.send({
                        embeds: [questionEmbed],
                        content: `**Options:**\n${optionsText}\n\n*React with the corresponding letter to answer!*`
                    });
                } else {
                    await targetChannel.send({ embeds: [questionEmbed] });
                }
            }
        }
        
        // Send instructions for getting results
        const resultsEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🏁 Quiz Complete!')
            .setDescription(`To get your personalized role recommendations:\n\n1. Answer all questions above\n2. React with ✅ to this message\n3. I'll calculate your results and suggest the best roles for you!\n\n${quizData.roleMapping.instructions}`)
            .setFooter({ text: 'Results are calculated based on your unique preferences' });
        
        await targetChannel.send({ embeds: [resultsEmbed] });
        
        // Store quiz data for result calculation (in production, use a database)
        const quizSession = {
            quizId: interaction.id,
            category,
            questions: quizData.questions,
            roleMapping: quizData.roleMapping,
            responses: new Map(),
            createdAt: Date.now()
        };
        
        // In production, store this in a database or cache
        console.log(`Quiz session created: ${interaction.id}`);
        
    } catch (error) {
        console.error('Error in role-quiz command:', error);
        await interaction.followUp({ 
            content: `❌ Error creating quiz: ${error.message}`, 
            ephemeral: true 
        });
    }
}

module.exports = { roleQuizCommand };
