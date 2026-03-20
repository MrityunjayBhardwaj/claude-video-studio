import Anthropic from "@anthropic-ai/sdk";
import { VideoScript } from "../types";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a video script writer. Given a topic, generate a compelling video script as a JSON object.

Return ONLY valid JSON matching this exact TypeScript type:
{
  title: string,
  slides: Array<{
    id: string,
    text: string,        // main text (short, impactful)
    subtitle?: string,   // optional supporting text
    duration: number,    // frames at 30fps (90=3s, 120=4s, 150=5s)
    background: string,  // CSS color (hex or gradient)
    textColor: string,   // CSS color
    fontSize: number     // px (40-80 recommended)
  }>
}

Guidelines:
- 4-8 slides per video
- Keep text concise and punchy (under 10 words per slide ideally)
- Use a consistent color palette
- Vary durations for pacing (90-180 frames)
- First slide: title/hook. Last slide: CTA or conclusion.`;

export async function generateScript(topic: string): Promise<VideoScript> {
  console.log(`Generating script for: "${topic}"...`);

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Create a video script about: ${topic}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = content.text.match(/```(?:json)?\s*([\s\S]*?)```/) ||
    content.text.match(/(\{[\s\S]*\})/);

  if (!jsonMatch) {
    throw new Error("No JSON found in Claude response");
  }

  const script: VideoScript = JSON.parse(jsonMatch[1]);
  console.log(`Generated script: "${script.title}" with ${script.slides.length} slides`);
  return script;
}
