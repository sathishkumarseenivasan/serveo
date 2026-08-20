module.exports = {
    name: 'build',
    description: 'Generate a full server from a text description',
    options: [
        {
            name: 'description',
            description: 'Describe the server you want to build (e.g., "A gaming community with ranked roles and private staff areas")',
            type: 3, // STRING
            required: true,
        },
    ],
};
