import * as https from "https";
import * as http from "http";
import { URL } from "url";

export interface OllamaMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OllamaGenerateOptions {
  model: string;
  prompt?: string;
  messages?: OllamaMessage[];
  temperature?: number;
  stream?: boolean;
}

export class OllamaClient {
  constructor(private baseUrl: string) {}

  /** List locally available models */
  async listModels(): Promise<string[]> {
    const data = await this.get("/api/tags");
    const parsed = JSON.parse(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (parsed.models ?? []).map((m: any) => m.name as string);
  }

  /** Non-streaming chat completion – returns full assistant reply */
  async chat(
    messages: OllamaMessage[],
    model: string,
    temperature: number,
    onToken?: (token: string) => void
  ): Promise<string> {
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
  async generate(
    prompt: string,
    model: string,
    temperature: number,
    onToken?: (token: string) => void
  ): Promise<string> {
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

  private request(path: string, method: "GET" | "POST", body?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const lib = url.protocol === "https:" ? https : http;
      const options: http.RequestOptions = {
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? "443" : "80"),
        path: url.pathname + url.search,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(body ? { "Content-Length": Buffer.byteLength(body) } : {}),
        },
        timeout: 120_000,
      };

      const req = lib.request(options, (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          if ((res.statusCode ?? 0) >= 400) {
            reject(new Error(`Ollama HTTP ${res.statusCode}: ${text}`));
          } else {
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

  private get(path: string): Promise<string> {
    return this.request(path, "GET");
  }

  private post(path: string, body: string): Promise<string> {
    return this.request(path, "POST", body);
  }

  /** Streaming POST – calls onToken for each partial token, returns full text */
  private postStream(
    path: string,
    body: string,
    onToken: (token: string) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const lib = url.protocol === "https:" ? https : http;
      const options: http.RequestOptions = {
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? "443" : "80"),
        path: url.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
        timeout: 300_000,
      };

      let full = "";

      const req = lib.request(options, (res) => {
        res.on("data", (chunk: Buffer) => {
          const lines = chunk.toString("utf8").split("\n").filter(Boolean);
          for (const line of lines) {
            try {
              const obj = JSON.parse(line);
              // /api/chat
              const token: string = obj.message?.content ?? obj.response ?? "";
              if (token) {
                full += token;
                onToken(token);
              }
              if (obj.done) {
                resolve(full);
              }
            } catch {
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
