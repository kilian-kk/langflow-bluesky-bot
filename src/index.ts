import { Bot, Post } from "@skyware/bot";
import { ChatGroq } from "@langchain/groq";
import { StateGraph, START, END, Annotation, Command } from "@langchain/langgraph";
import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';


const State = Annotation.Root({
  user_input: Annotation<string>(),
  graph_output: Annotation<string>(),
});


const groqNode = async (state: typeof State.State) => {
  const systemPrompt = `
    Du bist ein Social Media Manager Agent für Bluesky. 
    Entscheide für jeden Post, ob du antwortest (reply), likest (like), repostest (repost) – jede Kombination ist erlaubt, auch keine Aktion.
    Gib IMMER ein JSON-Objekt im folgenden Format zurück:
    {
      "reply": bool,
      "like": bool,
      "repost": bool,
      "reply_text": string
    }
    Wenn du nicht antwortest, setze reply_text auf einen leeren String.
  `;
  const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY!,
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
  });
  const response = await llm.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: state.user_input }
  ]);
  return { graph_output: response.content };
};


async function hilNode(state: typeof State.State): Promise<typeof State.State | Command> {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {

    const action = JSON.parse(state.graph_output);
    console.log("Vorgeschlagene Aktion:\n", action);
    const approval = await rl.question('Genehmigen? (y/n): ');

    if (approval.toLowerCase() === 'y') {
      console.log("Aktion angenommen. Alle Interaktionen werden ausgeführt.");
      return new Command({ goto: END });
    } else {

      const disabledAction = JSON.stringify({
        reply: false,
        like: false,
        repost: false,
        reply_text: ""
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
    .addNode("groq", groqNode)
    .addNode("hil", hilNode)
    .addEdge(START, "groq")
    .addEdge("groq", "hil")
    .addEdge("hil", END)
    .compile();

const bot = new Bot();
await bot.login({
  identifier: process.env.BSKY_USERNAME!,
  password: process.env.BSKY_PASSWORD!,
});

bot.on("reply", respondToIncoming);
bot.on("mention", respondToIncoming);
console.log(`[✓] @${process.env.BSKY_USERNAME} is listening for mentions and replies.\n`);

async function respondToIncoming(post: Post) {
  console.log(`[>] @${post.author.handle}: ${post.text}\n`);
  console.log(`    Post URI: ${post.uri}`);
  console.log(`    Post CID: ${post.cid}\n`);

  try {
    const response = await getLanggraphResponse(post.text);
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
  const response = await fetch('http://localhost:5000/run_graph', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ input_data: text })
  });
  
  const data = await response.json();
  return JSON.parse(data.graph_output); 
}

