"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const ollamaClient_1 = require("./ollamaClient");
const chatPanel_1 = require("./chatPanel");
const terminalIntegration_1 = require("./terminalIntegration");
function getConfig() {
    const cfg = vscode.workspace.getConfiguration("ollama");
    return {
        baseUrl: cfg.get("baseUrl", "http://localhost:11434"),
        model: cfg.get("model", "llama3"),
        temperature: cfg.get("temperature", 0.7),
    };
}
function activate(context) {
    // ── Open Chat Panel ────────────────────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand("ollama.openChat", () => {
        const { baseUrl, model, temperature } = getConfig();
        const client = new ollamaClient_1.OllamaClient(baseUrl);
        chatPanel_1.ChatPanel.createOrShow(client, model, temperature);
    }));
    // ── Ask about selection ────────────────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand("ollama.askSelection", () => {
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
        const client = new ollamaClient_1.OllamaClient(baseUrl);
        const panel = chatPanel_1.ChatPanel.createOrShow(client, model, temperature);
        panel.prefill(`Wyjaśnij poniższy kod:\n\`\`\`\n${selection}\n\`\`\``);
    }));
    // ── Send prompt to Terminal (docker exec) ──────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand("ollama.runInTerminal", async () => {
        const { model } = getConfig();
        const prompt = await vscode.window.showInputBox({
            prompt: "Wpisz zapytanie do Ollama (przez docker exec)",
            placeHolder: "np. Czym jest TypeScript?",
        });
        if (!prompt)
            return;
        await (0, terminalIntegration_1.sendToTerminal)(prompt, model);
    }));
    // ── Change Model ───────────────────────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand("ollama.changeModel", async () => {
        const { baseUrl } = getConfig();
        const client = new ollamaClient_1.OllamaClient(baseUrl);
        let models = [];
        try {
            models = await client.listModels();
        }
        catch {
            vscode.window.showErrorMessage("Ollama: nie można pobrać listy modeli. Czy kontener działa?");
            return;
        }
        if (!models.length) {
            vscode.window.showWarningMessage("Ollama: brak dostępnych modeli lokalnych.");
            return;
        }
        const picked = await vscode.window.showQuickPick(models, {
            placeHolder: "Wybierz model Ollama",
        });
        if (!picked)
            return;
        await vscode.workspace
            .getConfiguration("ollama")
            .update("model", picked, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Ollama: model zmieniony na ${picked}`);
    }));
}
function deactivate() { }
//# sourceMappingURL=extension.js.map