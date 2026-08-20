module.exports = {
    name: 'create-roles',
    description: 'Generate and assign roles intelligently',
    options: [
        {
            name: 'prompt',
            description: 'Describe what roles you want to create',
            type: 3, // STRING
            required: true,
        },
    ],
};
