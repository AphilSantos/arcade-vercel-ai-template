
## Features

- 🤖 Interactive chatbot interface for Arcade tools
- ⚡️ Built with Next.js for optimal performance
- 🛠 Seamless integration with Arcade SDK
- 🔄 Support for both cloud and local development environments
- 💬 Real-time chat interactions
- 🎨 Clean and intuitive user interface

## Prerequisites

Before you begin, ensure you have installed:

- Node.js 18.x or later
- pnpm (recommended) or another package manager
- An Arcade account with API access

## Installation

1. Clone the repository:

```bash
git clone https://github.com/ArcadeAI/arcade-chatbot.git
cd arcade-chatbot
```

2. Install dependencies:

```bash
pnpm install
```

## Configuration

### Environment Variables

You will need to use the environment variables [defined in `.env.example`](.env.example) to configure your application.

```bash
cp .env.example .env
```

> ⚠️ **Security Note**: Never commit your `.env` file to version control. It contains sensitive API keys that should remain private.

## Development

### Running Locally

1. Start the development server:

```bash
pnpm dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

### Local Toolkit Development

To develop and test your own tools:

1. Follow the [Arcade documentation](https://docs.arcade.dev/home/build-tools/create-a-toolkit) to create your toolkit

2. Start the local engine and actor:

```bash
arcade dev
```

3. Update `ARCADE_ENGINE_URL` in your `.env` to point to your local endpoint

4. Run the development server:

```bash
pnpm dev
```

## Deployment

The application can be deployed to any platform that supports Next.js applications. Follow the standard deployment procedures for your chosen platform.
