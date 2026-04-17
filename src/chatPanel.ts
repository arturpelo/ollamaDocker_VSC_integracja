import * as vscode from "vscode";
import { OllamaClient, OllamaMessage } from "./ollamaClient";

export class ChatPanel {
  public static currentPanel: ChatPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private _history: OllamaMessage[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    private readonly client: OllamaClient,
    private model: string,
    private temperature: number
  ) {
    this._panel = panel;
    this._panel.webview.html = this._getHtml();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.onDidReceiveMessage(
      (msg) => this._handleMessage(msg),
      null,
      this._disposables
    );
  }

  public static createOrShow(
    client: OllamaClient,
    model: string,
    temperature: number
  ): ChatPanel {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (ChatPanel.currentPanel) {
      ChatPanel.currentPanel._panel.reveal(column);
      ChatPanel.currentPanel.model = model;
      ChatPanel.currentPanel.temperature = temperature;
      return ChatPanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      "ollamaChat",
      "Ollama Chat",
      column ?? vscode.ViewColumn.Beside,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    ChatPanel.currentPanel = new ChatPanel(panel, client, model, temperature);
    return ChatPanel.currentPanel;
  }

  public prefill(text: string): void {
    this._panel.webview.postMessage({ type: "prefill", text });
  }

  private async _handleMessage(msg: { type: string; text?: string; clear?: boolean }): Promise<void> {
    if (msg.type === "send" && msg.text) {
      const userText = msg.text.trim();
      if (!userText) return;

      this._history.push({ role: "user", content: userText });
      this._panel.webview.postMessage({ type: "userMessage", text: userText });
      this._panel.webview.postMessage({ type: "thinking" });

      try {
        let full = "";
        await this.client.chat(
          this._history,
          this.model,
          this.temperature,
          (token) => {
            full += token;
            this._panel.webview.postMessage({ type: "token", token });
          }
        );
        this._history.push({ role: "assistant", content: full });
        this._panel.webview.postMessage({ type: "done" });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this._panel.webview.postMessage({ type: "error", text: message });
      }
    } else if (msg.type === "clear") {
      this._history = [];
    }
  }

  private _getHtml(): string {
    return /* html */ `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy"
  content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ollama Chat</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:var(--vscode-font-family);font-size:var(--vscode-font-size);
    background:var(--vscode-editor-background);color:var(--vscode-editor-foreground);
    display:flex;flex-direction:column;height:100vh;overflow:hidden}
  #messages{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px}
  .msg{padding:8px 12px;border-radius:6px;max-width:90%;white-space:pre-wrap;word-break:break-word;line-height:1.5}
  .user{align-self:flex-end;background:var(--vscode-button-background);color:var(--vscode-button-foreground)}
  .assistant{align-self:flex-start;background:var(--vscode-editor-inactiveSelectionBackground)}
  .thinking{align-self:flex-start;opacity:0.6;font-style:italic}
  #toolbar{display:flex;gap:6px;padding:8px;border-top:1px solid var(--vscode-panel-border)}
  #input{flex:1;resize:none;background:var(--vscode-input-background);color:var(--vscode-input-foreground);
    border:1px solid var(--vscode-input-border);border-radius:4px;padding:6px 8px;font-family:inherit;
    font-size:inherit;min-height:38px;max-height:160px}
  button{background:var(--vscode-button-background);color:var(--vscode-button-foreground);
    border:none;border-radius:4px;padding:6px 12px;cursor:pointer;font-size:inherit}
  button:hover{background:var(--vscode-button-hoverBackground)}
  button.secondary{background:var(--vscode-button-secondaryBackground);
    color:var(--vscode-button-secondaryForeground)}
</style>
</head>
<body>
<div id="messages"></div>
<div id="toolbar">
  <textarea id="input" rows="1" placeholder="Wpisz wiadomość… (Enter = wyślij, Shift+Enter = nowa linia)"></textarea>
  <button id="sendBtn">Wyślij</button>
  <button id="clearBtn" class="secondary">Wyczyść</button>
</div>
<script>
  const vscode = acquireVsCodeApi();
  const messagesEl = document.getElementById('messages');
  const inputEl    = document.getElementById('input');
  const sendBtn    = document.getElementById('sendBtn');
  const clearBtn   = document.getElementById('clearBtn');

  let assistantEl = null;
  let thinkingEl  = null;

  function addMessage(text, cls) {
    const el = document.createElement('div');
    el.className = 'msg ' + cls;
    el.textContent = text;
    messagesEl.appendChild(el);
    el.scrollIntoView({block:'end'});
    return el;
  }

  function send() {
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = '';
    inputEl.style.height = '';
    vscode.postMessage({type:'send', text});
  }

  sendBtn.addEventListener('click', send);
  clearBtn.addEventListener('click', () => {
    messagesEl.innerHTML = '';
    vscode.postMessage({type:'clear'});
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });
  inputEl.addEventListener('input', () => {
    inputEl.style.height = '';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 160) + 'px';
  });

  window.addEventListener('message', ({data}) => {
    if (data.type === 'prefill') {
      inputEl.value = data.text;
      inputEl.focus();
    } else if (data.type === 'userMessage') {
      addMessage(data.text, 'user');
    } else if (data.type === 'thinking') {
      thinkingEl = addMessage('Ollama pisze…', 'thinking');
      assistantEl = null;
    } else if (data.type === 'token') {
      if (thinkingEl) { thinkingEl.remove(); thinkingEl = null; }
      if (!assistantEl) assistantEl = addMessage('', 'assistant');
      assistantEl.textContent += data.token;
      assistantEl.scrollIntoView({block:'end'});
    } else if (data.type === 'done') {
      assistantEl = null;
    } else if (data.type === 'error') {
      if (thinkingEl) { thinkingEl.remove(); thinkingEl = null; }
      addMessage('Błąd: ' + data.text, 'thinking');
    }
  });
</script>
</body>
</html>`;
  }

  public dispose(): void {
    ChatPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) d.dispose();
    }
  }
}
