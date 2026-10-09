import translate from "google-translate-api-x";

const PAUSE_MS = 350;
const CHUNK_SIZE = 4500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function translateDeToEn(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;

  let combined = "";
  for (let offset = 0; offset < trimmed.length; offset += CHUNK_SIZE) {
    const piece = trimmed.slice(offset, offset + CHUNK_SIZE);
    const result = await translate(piece, {
      from: "de",
      to: "en",
      autoCorrect: false,
    });
    combined += result.text;
    if (offset + CHUNK_SIZE < trimmed.length) {
      await sleep(PAUSE_MS);
    }
  }
  await sleep(PAUSE_MS);
  return combined;
}
