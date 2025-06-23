import { Bot, Post } from "@skyware/bot";
import { ChatGroq } from "@langchain/groq";
import {
  StateGraph,
  START,
  END,
  Annotation,
  Command,
} from "@langchain/langgraph";
import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { MyGraphState } from "../graphStateType.js";

const State = Annotation.Root({
  user_input: Annotation<string>(),
  graph_output: Annotation<string>(),
});

async function hilNode(
  state: typeof State.State
): Promise<typeof State.State | Command> {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    const action = JSON.parse(state.graph_output);
    console.log("Vorgeschlagene Aktion:\n", action);
    const approval = await rl.question("Genehmigen? (y/n): ");

    if (approval.toLowerCase() === "y") {
      console.log("Aktion angenommen. Alle Interaktionen werden ausgeführt.");
      return new Command({ goto: END });
    } else {
      const disabledAction = JSON.stringify({
        reply: false,
        like: false,
        repost: false,
        reply_text: "",
      });

      console.log("Aktion abgelehnt. Alle Interaktionen deaktiviert.");
      return {
        ...state,
        graph_output: disabledAction,
      };
    }
  } finally {
    rl.close();
  }
}

const graph = new StateGraph(State)
  .addNode("hil", hilNode)
  .addEdge(START, "hil")
  .addEdge("hil", END)
  .compile();

const bot = new Bot();
await bot.login({
  identifier: process.env.BSKY_USERNAME!,
  password: process.env.BSKY_PASSWORD!,
});

bot.on("reply", respondToIncoming);
bot.on("mention", respondToIncoming);
console.log(
  `[✓] @${process.env.BSKY_USERNAME} is listening for mentions and replies.\n`
);

async function respondToIncoming(post: Post) {
  console.log(`[>] @${post.author.handle}: ${post.text}\n`);
  console.log(`    Post URI: ${post.uri}`);
  console.log(`    Post CID: ${post.cid}\n`);

  try {
    const response_raw = await getLanggraphResponse(post.text);
    const response = response_raw.data.graph_output;
    console.log(response);
    if (response.reply) {
      await post.reply({ text: response.reply_text });
    }
    if (response.like) {
      await post.like();
    }
    if (response.repost) {
      await post.repost();
    }
  } catch (error) {
    console.error(error);
  }
}

// async function getLanggraphResponse(text: string) {
//   const result = await graph.invoke({ user_input: text });
//   return JSON.parse(result.graph_output);
// }

async function getLanggraphResponse(text: string) {
  const incoming_data = JSON.stringify({ input_data: text });
  console.log(incoming_data);
  const response = await fetch("http://127.0.0.1:5000/analyze-comment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: incoming_data,
  });

  const data = await response.json();
  const graphData = data as MyGraphState;
  const graphOutputString = JSON.stringify(graphData);
  // graph_output von der externen API erhalten und im Graph weitergeben
  console.log(graphOutputString);

  const result = await graph.invoke({
    user_input: text,
    graph_output: graphOutputString,
  });

  return JSON.parse(result.graph_output);
}
