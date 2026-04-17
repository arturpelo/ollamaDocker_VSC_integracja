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
exports.sendToTerminal = sendToTerminal;
const vscode = __importStar(require("vscode"));
/**
 * Sends a prompt to the Ollama container via the integrated terminal.
 * Uses `docker exec` so no extra tooling is needed beyond Docker.
 */
async function sendToTerminal(prompt, model) {
    // Sanitize the prompt for safe shell embedding
    const escaped = prompt.replace(/'/g, `'"'"'`);
    let terminal = vscode.window.terminals.find((t) => t.name === "Ollama");
    if (!terminal) {
        terminal = vscode.window.createTerminal({ name: "Ollama" });
    }
    terminal.show(true);
    // Send via docker exec – mirrors the user's workflow
    terminal.sendText(`docker exec -i ollama ollama run ${model} '${escaped}'`, true);
}
//# sourceMappingURL=terminalIntegration.js.map