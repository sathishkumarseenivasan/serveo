# 🤖 Serveo Bot — AI-Powered Discord Server Builder

An intelligent Discord bot that autonomously designs, builds, and configures your entire server — channels, categories, roles, and permissions — using its own AI reasoning. Just describe what you want, and Serveo Bot handles the rest.

## ✨ Features

### Core Features
- **AI-Driven Server Generation** — Describe your community and the bot thinks through the ideal server structure for you
- **Auto Channel & Category Creation** — Generates organized channels grouped into logical categories
- **Smart Role System** — Creates roles with appropriate hierarchy based on your server's purpose
- **Intelligent Permission Engine** — Applies permission overwrites autonomously, reasoning about who should access what
- **Zero Manual Setup** — No need to drag channels or configure permission toggles by hand
- **Customizable Prompts** — Guide the AI with natural language; it adapts to your vision

### 🌟 UNIQUE Features (Found Only in Serveo Bot!)

#### 🏥 `/health-check` - AI Server Health Analysis
Get a comprehensive health score for your server with actionable recommendations! The AI analyzes:
- Member engagement patterns
- Channel activity levels
- Community strengths and weaknesses
- Specific improvement suggestions with priority levels
- Engagement tips tailored to your community type

#### 🎯 `/role-quiz` - Interactive Role Discovery Quizzes
Let members discover their perfect roles through AI-generated personality quizzes! Features:
- Custom quizzes for any role category (games, skills, interests)
- Interactive button-based questions
- Automatic role assignment based on quiz results
- Unique scoring system tailored to your server's roles
- Engaging questions that members love

#### 🎉 `/event-planner` - AI Event Planning Assistant
Never run out of event ideas! Get complete event planning guides including:
- Creative event ideas tailored to your server type
- Full planning timelines with checklists
- Ready-to-use announcement templates
- Seasonal event suggestions
- Difficulty ratings and engagement predictions

#### 👋 `/onboarding` - Personalized Member Onboarding
Create welcoming experiences that turn new members into active participants:
- Custom welcome messages with embeds
- Step-by-step onboarding journeys
- Channel guides with priority levels
- Role recommendations for newcomers
- FAQ generation specific to your server
- First-week goal suggestions

## 🚀 Demo

### Basic Server Build
```
/build server for a gaming community with ranked roles and private staff areas
```

The bot will:
1. Analyze your request
2. Plan the server structure using AI reasoning
3. Create all categories, channels, and roles
4. Apply permission logic automatically

### Using Unique Features
```
/health-check focus:engagement
```
Get a detailed health report with engagement improvement strategies!

```
/role-quiz category:gaming-roles channel:#role-selection
```
Generate an interactive quiz to help members find their gaming preferences!

```
/event-planner type:community-bonding frequency:monthly
```
Receive creative event ideas with complete planning guides!

```
/onboarding server-type:gaming welcome-channel:#welcome
```
Create a personalized onboarding flow for new gamers!

## 📦 Installation

### Prerequisites

- Node.js v18+
- A Discord Bot Token (from Discord Developer Portal)
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

## 🛠️ Usage

### Slash Commands

| Command | Description | Unique Feature |
|---------|-------------|----------------|
| `/build <description>` | Generate a full server from a text description | ❌ |
| `/add-channels <prompt>` | Add new channels using AI reasoning | ❌ |
| `/create-roles <prompt>` | Generate and assign roles intelligently | ❌ |
| `/permissions <prompt>` | Reconfigure permissions with AI logic | ❌ |
| `/reset` | Clear all generated channels and roles | ❌ |
| `/health-check [focus]` | 🏥 AI analyzes server health with recommendations | ✅ EXCLUSIVE |
| `/role-quiz <category>` | 🎯 Generate interactive role discovery quizzes | ✅ EXCLUSIVE |
| `/event-planner [type]` | 🎉 AI-powered event planning with templates | ✅ EXCLUSIVE |
| `/onboarding <server-type>` | 👋 Create personalized member onboarding flows | ✅ EXCLUSIVE |

### Examples

```bash
# Build a complete server
/build A crypto trading server with public news, private VIP signals, and mod tools
/build A school community with student, teacher, and admin sections
/build A game dev studio server with departments for art, code, and design

# Use unique features
/health-check focus:comprehensive
/role-quiz category:game-roles channel:#roles
/event-planner type:game-night frequency:weekly
/onboarding server-type:art-community welcome-channel:#introductions
```

## 🧠 How the AI Works

Serveo Bot uses a language model (Anthropic Claude) to reason about your server before building it. It doesn't follow a fixed template — it thinks through:

- What categories make sense for your use case
- Which channels belong in each category
- What roles are needed and their hierarchy
- Who should have read, write, or admin access to each channel
- Where private or restricted areas are appropriate

This means every server it builds is unique and tailored to your description.

### Advanced AI Capabilities

Our unique features leverage advanced AI reasoning for:

1. **Health Analysis**: Evaluates multiple metrics to provide actionable insights
2. **Quiz Generation**: Creates psychologically engaging questions with meaningful scoring
3. **Event Planning**: Considers server demographics, timezones, and community interests
4. **Onboarding Design**: Crafts welcoming experiences based on server culture and type

## 🔐 Permissions Required

The bot requires the following Discord permissions:

- Manage Channels
- Manage Roles
- Manage Guild
- View Channels
- Send Messages

Use this permission integer when inviting the bot: `268435456`

## 📁 Project Structure

```
serveo-bot/
├── src/
│   ├── commands/                    # Slash command handlers
│   │   ├── build.js                 # Core: Server builder
│   │   ├── add-channels.js          # Core: Channel adder
│   │   ├── create-roles.js          # Core: Role creator
│   │   ├── permissions.js           # Core: Permission manager
│   │   ├── reset.js                 # Core: Server reset
│   │   ├── health-check.js          # ⭐ UNIQUE: Health analyzer
│   │   ├── role-quiz.js             # ⭐ UNIQUE: Quiz generator
│   │   ├── event-planner.js         # ⭐ UNIQUE: Event planner
│   │   └── onboarding.js            # ⭐ UNIQUE: Onboarding creator
│   │   └── *-command-data.js        # Command registration data
│   ├── ai/                          # AI prompting & reasoning logic
│   │   ├── server-analyzer.js       # Core AI analysis
│   │   └── advanced-features.js     # ⭐ UNIQUE: Advanced AI features
│   ├── builders/                    # Channel, role & permission builders
│   │   ├── channel-builder.js
│   │   └── role-builder.js
│   ├── scripts/                     # Utility scripts
│   │   └── deploy-commands.js
│   └── index.js                     # Entry point
├── .env.example
├── package.json
└── README.md
```

## 🆚 Why Choose Serveo Bot?

| Feature | Serveo Bot | Other Bots |
|---------|------------|------------|
| AI Server Building | ✅ | ❌ |
| Health Analytics | ✅ Exclusive | ❌ |
| Interactive Quizzes | ✅ Exclusive | ❌ |
| Event Planning | ✅ Exclusive | ❌ |
| Custom Onboarding | ✅ Exclusive | ❌ |
| Natural Language | ✅ | ⚠️ Limited |
| Permission Reasoning | ✅ | ❌ |

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a pull request

## 📄 License

ISC

## 🙏 Acknowledgments

- [Discord.js](https://discord.js.org/) - Discord API wrapper
- [Anthropic](https://www.anthropic.com/) - AI provider

## 💡 Roadmap

- [ ] Sentiment analysis for community conversations
- [ ] Conflict resolution assistant for moderators
- [ ] Channel archival recommendations
- [ ] Auto-moderation policy generator
- [ ] Multi-language support
- [ ] Web dashboard for server analytics
