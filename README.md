# Instalacja wtyczki Ollama Local AI – instalacja przez plik .vsix

## Wymagania wstępne

- [VS Code](https://code.visualstudio.com/) zainstalowany
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) zainstalowany i uruchomiony
- Plik `ollama-local-ai.vsix` (skopiowany na komputer)

> **Node.js nie jest wymagany** – plik `.vsix` zawiera już skompilowane rozszerzenie.

---

## Krok 1 – Zainstaluj rozszerzenie z pliku .vsix

**Opcja A – przez terminal (szybciej):**

```powershell
code --install-extension ollama-vsc-0.1.0.vsix
```

**Opcja B – przez interfejs VS Code:**

1. Otwórz VS Code.
2. Naciśnij `Ctrl+Shift+X`, aby otworzyć panel **Extensions**.
3. Kliknij ikonę `...` (trzy kropki) w prawym górnym rogu panelu.
4. Wybierz **Install from VSIX…**
5. Wskaż plik `.vsix` i potwierdź.

Po instalacji kliknij **Reload Window** gdy VS Code o to poprosi.

---

## Krok 2 – Uruchom kontener Ollama w Dockerze

Otwórz terminal (PowerShell) i wykonaj:

```powershell
docker run -d --gpus all -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

> Jeśli kontener już istnieje (był wcześniej zatrzymany):
> ```powershell
> docker start ollama
> ```

---

## Krok 3 – Pobierz model AI (jednorazowo)

```powershell
docker exec -it ollama ollama pull llama3
```

Możesz zastąpić `llama3` innym modelem, np. `mistral`, `phi3`, `gemma`.

---

## Krok 4 – Weryfikacja połączenia

Sprawdź czy API Ollamy odpowiada:

```powershell
Invoke-RestMethod http://localhost:11434/api/tags
```

Powinna pojawić się lista dostępnych modeli w formacie JSON.

---

## Krok 5 – Używanie wtyczki

Naciśnij `Ctrl+Shift+P` i wyszukaj jedną z komend:

| Komenda | Opis |
|---|---|
| `Ollama: Open Chat Panel` | Otwiera panel czatu (streaming) |
| `Ollama: Ask about selection` | Zaznacz kod → wyjaśnij przez Ollama |
| `Ollama: Send prompt to Terminal` | Wysyła zapytanie przez `docker exec` w terminalu VS Code |
| `Ollama: Change Model` | Wybiera model z listy dostępnych lokalnie |

---

## Ustawienia wtyczki

Przejdź do **File → Preferences → Settings** i wyszukaj `ollama`, aby skonfigurować:

| Ustawienie | Domyślna wartość | Opis |
|---|---|---|
| `ollama.baseUrl` | `http://localhost:11434` | Adres API Ollamy |
| `ollama.model` | `llama3` | Domyślny model |
| `ollama.temperature` | `0.7` | Kreatywność odpowiedzi (0–1) |
