module.exports = {
    name: 'permissions',
    description: 'Reconfigure permissions with AI logic',
    options: [
        {
            name: 'prompt',
            description: 'Describe how you want to configure permissions',
            type: 3, // STRING
            required: true,
        },
    ],
};
