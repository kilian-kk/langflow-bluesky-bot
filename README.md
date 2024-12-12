# Bluesky bots with Langflow

This is an example of a [Bluesky](https://bsky.social/about) bot that responds to mentions and replies by passing the post text to a flow built with [Langflow](https://docs.datastax.com/en/langflow/index.html) and responding with the result of the flow.

- [The bot](#the-bot)
  - [Prerequisites](#prerequisites)
  - [Preparation](#preparation)
    - [Langflow](#langflow)
  - [Running the bot](#running-the-bot)

## The bot

The bot uses the [AT Protocol](https://atproto.com/) to communicate with Bluesky and is powered by [@skyware/bot](https://skyware.js.org/guides/bot/introduction/getting-started/).

It listens for mentions and replies to an account you provide. When it receives an incoming post it will trigger a Langflow flow with the text from the post, and reply using the output from the flow.

### Prerequisites

To run this application you will need:

- [Node.js](https://nodejs.org/en) (version 22)
- [A Bluesky account](https://bsky.app/)
  - Generate an [app password for the account](https://blueskyfeeds.com/en/faq-app-password), you will need it later
- A DataStax account ([sign up for a free account here](https://astra.datastax.com/signup))
  - You can use the [self-hosted version of Langflow](https://www.langflow.org/) but you will need to adjust the code to remove or update how the API key is handled
- For generative AI flows: accounts API keys for any service you want to use

### Preparation

Clone the repo:

```sh
git clone https://github.com/philnash/langflow-bluesky-bot.git
cd langflow-bluesky-bot
```

Install the dependencies:

```sh
npm install
```

Copy the `.env.example` file to `.env`:

```sh
cp .env.example .env
```

Fill in the `.env` file with your Bluesky account name and app password.

#### Langflow

Log into your DataStax account and open the [Langflow dashboard](https://astra.datastax.com/langflow). Create a flow that has a chat input, does some processing in the middle, and returns the result as a chat output.

If you're getting started with Langflow, the [_Basic Prompting_ template](https://docs.langflow.org/starter-projects-basic-prompting) is the simplest generative AI flow that will work. Make sure you fill in the model component with an API key.

Once you are happy with the flow, click on the _API_ button. This will show you how to access the flow via API. You will need the URL, which is most easily found on the cURL tab. You will also need an API token, which you can generate from the modal.

Once you have the URL and token, fill in the rest of the variables in the `.env` file.

### Running the bot

Once you have all your credentials you can run the application with the following command:

```sh
npm run dev
```

This runs the app in a development mode where it will recompile and restart when you make a change.

If you want to run the application without that, you can build it first, which will compile the TypeScript into plain JavaScript.

```sh
npm run build
```

Then you can run the JavaScript directly with:

```sh
npm start
```
