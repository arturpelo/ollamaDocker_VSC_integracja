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
exports.OllamaClient = void 0;
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const url_1 = require("url");
class OllamaClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    /** List locally available models */
    async listModels() {
        const data = await this.get("/api/tags");
        const parsed = JSON.parse(data);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (parsed.models ?? []).map((m) => m.name);
    }
    /** Non-streaming chat completion – returns full assistant reply */
    async chat(messages, model, temperature, onToken) {
        const body = JSON.stringify({
            model,
            messages,
            options: { temperature },
            stream: !!onToken,
        });
        if (onToken) {
            return this.postStream("/api/chat", body, onToken);
        }
        const raw = await this.post("/api/chat", body);
        const parsed = JSON.parse(raw);
        return parsed.message?.content ?? "";
    }
    /** Non-streaming generate (single prompt) */
    async generate(prompt, model, temperature, onToken) {
        const body = JSON.stringify({
            model,
            prompt,
            options: { temperature },
            stream: !!onToken,
        });
        if (onToken) {
            return this.postStream("/api/generate", body, onToken);
        }
        const raw = await this.post("/api/generate", body);
        const parsed = JSON.parse(raw);
        return parsed.response ?? "";
    }
    // ── low-level helpers ──────────────────────────────────────────────────────
    request(path, method, body) {
        return new Promise((resolve, reject) => {
            const url = new url_1.URL(path, this.baseUrl);
            const lib = url.protocol === "https:" ? https : http;
            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === "https:" ? "443" : "80"),
                path: url.pathname + url.search,
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...(body ? { "Content-Length": Buffer.byteLength(body) } : {}),
                },
                timeout: 120000,
            };
            const req = lib.request(options, (res) => {
                const chunks = [];
                res.on("data", (chunk) => chunks.push(chunk));
                res.on("end", () => {
                    const text = Buffer.concat(chunks).toString("utf8");
                    if ((res.statusCode ?? 0) >= 400) {
                        reject(new Error(`Ollama HTTP ${res.statusCode}: ${text}`));
                    }
                    else {
                        resolve(text);
                    }
                });
            });
            req.on("error", reject);
            req.on("timeout", () => {
                req.destroy();
                reject(new Error("Ollama request timed out"));
            });
            if (body) {
                req.write(body);
            }
            req.end();
        });
    }
    get(path) {
        return this.request(path, "GET");
    }
    post(path, body) {
        return this.request(path, "POST", body);
    }
    /** Streaming POST – calls onToken for each partial token, returns full text */
    postStream(path, body, onToken) {
        return new Promise((resolve, reject) => {
            const url = new url_1.URL(path, this.baseUrl);
            const lib = url.protocol === "https:" ? https : http;
            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === "https:" ? "443" : "80"),
                path: url.pathname,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(body),
                },
                timeout: 300000,
            };
            let full = "";
            const req = lib.request(options, (res) => {
                res.on("data", (chunk) => {
                    const lines = chunk.toString("utf8").split("\n").filter(Boolean);
                    for (const line of lines) {
                        try {
                            const obj = JSON.parse(line);
                            // /api/chat
                            const token = obj.message?.content ?? obj.response ?? "";
                            if (token) {
                                full += token;
                                onToken(token);
                            }
                            if (obj.done) {
                                resolve(full);
                            }
                        }
                        catch {
                            // partial JSON line – ignore
                        }
                    }
                });
                res.on("end", () => resolve(full));
                res.on("error", reject);
            });
            req.on("error", reject);
            req.on("timeout", () => {
                req.destroy();
                reject(new Error("Ollama stream timed out"));
            });
            req.write(body);
            req.end();
        });
    }
}
exports.OllamaClient = OllamaClient;
//# sourceMappingURL=ollamaClient.js.map