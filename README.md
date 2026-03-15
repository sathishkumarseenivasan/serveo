# 🤖 Serveo Bot — AI-Powered Discord Server Builder

> An intelligent Discord bot that autonomously designs, builds, and configures your entire server — channels, categories, roles, and permissions — using its own AI reasoning. Just describe what you want, and Serveo Bot handles the rest.

---

## ✨ Features

- **AI-Driven Server Generation** — Describe your community and the bot thinks through the ideal server structure for you
- **Auto Channel & Category Creation** — Generates organized channels grouped into logical categories
- **Smart Role System** — Creates roles with appropriate hierarchy based on your server's purpose
- **Intelligent Permission Engine** — Applies permission overwrites autonomously, reasoning about who should access what
- **Zero Manual Setup** — No need to drag channels or configure permission toggles by hand
- **Customizable Prompts** — Guide the AI with natural language; it adapts to your vision

---

## 🚀 Demo

```
/build server for a gaming community with ranked roles and private staff areas
```

The bot will:
1. Analyze your request
2. Plan the server structure using AI reasoning
3. Create all categories, channels, and roles
4. Apply permission logic automatically

---

## 📦 Installation

### Prerequisites

- Node.js `v18+`
- A Discord Bot Token ([Discord Developer Portal](https://discord.com/developers/applications))
- An Anthropic API Key (or your preferred AI provider)

### Steps

```bash
# Clone the repository
git clone https://github.com/yourusername/serveo-bot.git
cd serveo-bot

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

Edit `.env`:

```env
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
ANTHROPIC_API_KEY=your_api_key
```

```bash
# Register slash commands
npm run deploy-commands

# Start the bot
npm start
```

---

## 🛠️ Usage

### Slash Commands

| Command | Description |
|--------|-------------|
| `/build <description>` | Generate a full server from a text description |
| `/add-channels <prompt>` | Add new channels using AI reasoning |
| `/create-roles <prompt>` | Generate and assign roles intelligently |
| `/permissions <prompt>` | Reconfigure permissions with AI logic |
| `/reset` | Clear all generated channels and roles |

### Examples

```
/build A crypto trading server with public news, private VIP signals, and mod tools

/build A school community with student, teacher, and admin sections

/build A game dev studio server with departments for art, code, and design
```

---

## 🧠 How the AI Works

Serveo Bot uses a language model to reason about your server before building it. It doesn't follow a fixed template — it thinks through:

- What categories make sense for your use case
- Which channels belong in each category
- What roles are needed and their hierarchy
- Who should have read, write, or admin access to each channel
- Where private or restricted areas are appropriate

This means every server it builds is unique and tailored to your description.

---

## 🔐 Permissions Required

The bot requires the following Discord permissions:

- `Manage Channels`
- `Manage Roles`
- `Manage Guild`
- `View Channels`
- `Send Messages`

Use this permission integer when inviting the bot: `268435456`

---

## 📁 Project Structure

```
serveo-bot/
├── src/
│   ├── commands/        # Slash command handlers
│   ├── ai/              # AI prompting & reasoning logic
│   ├── builders/        # Channel, role & permission builders
│   └── index.js         # Entry point
├── .env.example
├── package.json
└── README.md
```

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a pull request

---

## 📄 License

[MIT](LICENSE)

---

## ⭐ Support

If you find this project useful, consider giving it a star on GitHub — it helps a lot!

For issues or questions, open a [GitHub Issue](https://github.com/yourusername/serveo-bot/issues).
