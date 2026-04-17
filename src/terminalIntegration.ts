import * as vscode from "vscode";

/**
 * Sends a prompt to the Ollama container via the integrated terminal.
 * Uses `docker exec` so no extra tooling is needed beyond Docker.
 */
export async function sendToTerminal(
  prompt: string,
  model: string
): Promise<void> {
  // Sanitize the prompt for safe shell embedding
  const escaped = prompt.replace(/'/g, `'"'"'`);

  let terminal = vscode.window.terminals.find((t) => t.name === "Ollama");
  if (!terminal) {
    terminal = vscode.window.createTerminal({ name: "Ollama" });
  }
  terminal.show(true);

  // Send via docker exec – mirrors the user's workflow
  terminal.sendText(
    `docker exec -i ollama ollama run ${model} '${escaped}'`,
    true
  );
}
