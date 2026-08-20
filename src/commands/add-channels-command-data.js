module.exports = {
    name: 'add-channels',
    description: 'Add new channels using AI reasoning',
    options: [
        {
            name: 'prompt',
            description: 'Describe what channels you want to add',
            type: 3, // STRING
            required: true,
        },
    ],
};
