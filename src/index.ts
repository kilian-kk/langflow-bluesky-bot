import { Bot, Post } from "@skyware/bot";

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
  try {
    const text = await getLangflowResponse(post.text);
    console.log(`[<] @${process.env.BSKY_USERNAME}: ${text}\n`);
    await post.reply({ text });
  } catch (error) {
    console.error(error);
  }
}

async function getLangflowResponse(text: string) {
  const body = {
    input_type: "chat",
    output_type: "chat",
    input_value: text,
  };
  const response = await fetch(process.env.LANGFLOW_URL!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LANGFLOW_TOKEN!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error("Could not respond", { cause: response });
  }
  const data = (await response.json()) as any;
  return data.outputs[0].outputs[0].artifacts.message;
}
