# big-a-cli

A powerful CLI chat tool with AI integration and stock monitoring.

## Features

- Interactive AI chat with streaming responses
- Stock real-time quotes and analysis
- Stock price monitoring with alerts
- Beautiful terminal UI with Ink
- Command history (arrow keys)
- Tab completion for commands

## Installation

```bash
npm install -g @ali/big-a-cli
```

## Configuration

Create a `.env` file in your home directory or current working directory:

```bash
AI_API_KEY=your_api_key_here
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-3.5-turbo
```

## Usage

Start the chat:

```bash
big-a
```

## Commands

- `/help` - Show help information
- `/clear` - Clear chat history
- `/stock <code>` - Query stock quotes (e.g., `/stock 600519`)
- `/analyze <code>` - Deep analyze stock (e.g., `/analyze 600519`)
- `/monitor` - Interactive stock monitoring setup
- `/monitor stop` - Stop monitoring
- `/monitor status` - Check monitoring status

## Requirements

- Node.js >= 18.0.0

## License

MIT
