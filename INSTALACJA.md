# Instalacja wtyczki Ollama Local AI – przeniesienie na inny komputer

## Wymagania wstępne

- [VS Code](https://code.visualstudio.com/) zainstalowany
- [Node.js](https://nodejs.org/) w wersji 18 lub nowszej
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) zainstalowany i uruchomiony

---

## Krok 1 – Skopiuj folder projektu

Skopiuj cały folder `Nowy folder` na docelowy komputer (pendrive, sieć lokalna, itp.).

---

## Krok 2 – Zainstaluj zależności i skompiluj

Otwórz terminal (PowerShell lub cmd) w skopiowanym folderze i wykonaj:

```powershell
npm install
npm run compile
```

Po chwili powinien pojawić się katalog `out/` z plikami `.js`.

---

## Krok 3 – Uruchom wtyczkę w VS Code

1. Otwórz VS Code.
2. Wybierz **File → Open Folder…** i wskaż skopiowany folder.
3. Naciśnij **F5** – otworzy się nowe okno **Extension Development Host** z aktywną wtyczką.

---

## Krok 4 – Uruchom kontener Ollama

Jeśli kontener nie jest jeszcze uruchomiony, wykonaj w terminalu:

```powershell
docker run -d --gpus all -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

> Jeśli kontener już istnieje (był wcześniej zatrzymany), wystarczy:
> ```powershell
> docker start ollama
> ```

Załaduj model (jednorazowo lub gdy chcesz go użyć interaktywnie):

```powershell
docker exec -it ollama ollama run llama3
```

---

## Krok 5 – Weryfikacja połączenia

Sprawdź czy API Ollamy odpowiada:

```powershell
Invoke-RestMethod http://localhost:11434/api/tags
```

Powinna pojawić się lista dostępnych modeli w formacie JSON.

---

## Używanie wtyczki

W oknie Extension Development Host naciśnij `Ctrl+Shift+P` i wyszukaj jedną z komend:

| Komenda | Opis |
|---|---|
| `Ollama: Open Chat Panel` | Otwiera panel czatu (streaming) |
| `Ollama: Ask about selection` | Zaznacz kod → wyjaśnij przez Ollama |
| `Ollama: Send prompt to Terminal` | Wysyła zapytanie przez `docker exec` w terminalu VS Code |
| `Ollama: Change Model` | Wybiera model z listy dostępnych lokalnie |

---

## Konfiguracja (opcjonalnie)

W `settings.json` (lub przez **File → Preferences → Settings** → szukaj `ollama`) możesz zmienić:

```json
"ollama.baseUrl": "http://localhost:11434",
"ollama.model": "llama3",
"ollama.temperature": 0.7
```

---

## Rozwiązywanie problemów

| Problem | Rozwiązanie |
|---|---|
| `Ollama: nie można pobrać listy modeli` | Sprawdź czy kontener działa: `docker ps` |
| Port 11434 zajęty | Zmień port w `docker run` i w ustawieniu `ollama.baseUrl` |
| Brak GPU / błąd `--gpus all` | Usuń flagę `--gpus all` z komendy `docker run` (wolniejsze, ale działa na CPU) |
| `npm run compile` zgłasza błędy | Upewnij się że masz Node.js ≥ 18: `node --version` |
