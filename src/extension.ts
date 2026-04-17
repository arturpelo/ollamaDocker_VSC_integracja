import * as vscode from "vscode";
import { OllamaClient } from "./ollamaClient";
import { ChatPanel } from "./chatPanel";
import { sendToTerminal } from "./terminalIntegration";

function getConfig() {
  const cfg = vscode.workspace.getConfiguration("ollama");
  return {
    baseUrl: cfg.get<string>("baseUrl", "http://localhost:11434"),
    model: cfg.get<string>("model", "llama3"),
    temperature: cfg.get<number>("temperature", 0.7),
  };
}

export function activate(context: vscode.ExtensionContext): void {
  // ── Open Chat Panel ────────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("ollama.openChat", () => {
      const { baseUrl, model, temperature } = getConfig();
      const client = new OllamaClient(baseUrl);
      ChatPanel.createOrShow(client, model, temperature);
    })
  );

  // ── Ask about selection ────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("ollama.askSelection", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage("Ollama: brak aktywnego edytora.");
        return;
      }
      const selection = editor.document.getText(editor.selection).trim();
      if (!selection) {
        vscode.window.showWarningMessage("Ollama: zaznacz fragment kodu.");
        return;
      }

      const { baseUrl, model, temperature } = getConfig();
      const client = new OllamaClient(baseUrl);
      const panel = ChatPanel.createOrShow(client, model, temperature);
      panel.prefill(
        `Wyjaśnij poniższy kod:\n\`\`\`\n${selection}\n\`\`\``
      );
    })
  );

  // ── Send prompt to Terminal (docker exec) ──────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("ollama.runInTerminal", async () => {
      const { model } = getConfig();
      const prompt = await vscode.window.showInputBox({
        prompt: "Wpisz zapytanie do Ollama (przez docker exec)",
        placeHolder: "np. Czym jest TypeScript?",
      });
      if (!prompt) return;
      await sendToTerminal(prompt, model);
    })
  );

  // ── Change Model ───────────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("ollama.changeModel", async () => {
      const { baseUrl } = getConfig();
      const client = new OllamaClient(baseUrl);

      let models: string[] = [];
      try {
        models = await client.listModels();
      } catch {
        vscode.window.showErrorMessage(
          "Ollama: nie można pobrać listy modeli. Czy kontener działa?"
        );
        return;
      }

      if (!models.length) {
        vscode.window.showWarningMessage(
          "Ollama: brak dostępnych modeli lokalnych."
        );
        return;
      }

      const picked = await vscode.window.showQuickPick(models, {
        placeHolder: "Wybierz model Ollama",
      });
      if (!picked) return;

      await vscode.workspace
        .getConfiguration("ollama")
        .update("model", picked, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(`Ollama: model zmieniony na ${picked}`);
    })
  );
}

export function deactivate(): void {}
