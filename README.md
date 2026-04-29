# Instalacja wtyczki Ollama Local AI – instalacja przez plik .vsix

## Wymagania wstępne

- [VS Code](https://code.visualstudio.com/) zainstalowany
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) zainstalowany i uruchomiony
- Plik `ollama-local-ai.vsix` (skopiowany na komputer)

> **Node.js nie jest wymagany** – plik `.vsix` zawiera już skompilowane rozszerzenie.

---

## Krok 1 – Zainstaluj rozszerzenie z pliku .vsix

**Opcja A – przez terminal (szybciej):**
Pobierz cale repo jako zip i rozpakuj.

```powershell
code --install-extension ollama-vsc-0.1.0.vsix
```

**Opcja B – przez interfejs VS Code:**

1. Pobierz i rozpakuj całe repo.
2. Otwórz VS Code.
3. Naciśnij `Ctrl+Shift+X`, aby otworzyć panel **Extensions**.
4. Kliknij ikonę `...` (trzy kropki) w prawym górnym rogu panelu.
5. Wybierz **Install from VSIX…**
6. Wskaż plik `.vsix` i potwierdź.

Po instalacji kliknij **Reload Window** gdy VS Code o to poprosi.

---

## Krok 2 – Uruchom kontener Ollama w Dockerze

Otwórz terminal (PowerShell) i wykonaj:

dla komputera z kartą graficzną
```powershell
docker run -d --gpus all -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```
lub (bez karty graficznej w komputerze) Uwaga! jeśli wykonałeś powyższe polecenie z błędem to skasuj kontener

```powershell
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```


```powershell
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

Uruchom kontener w dockerze lub z terminala za pomocą:
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

## Krok 4 – Weryfikacja połączenia (niekoniecznie)

Sprawdź czy API Ollamy odpowiada:

```powershell
Invoke-RestMethod http://localhost:11434/api/tags
```

Powinna pojawić się lista dostępnych modeli w formacie JSON.

---

## Krok 5 – Używanie wtyczki (potem już tylko TO w VSC)

Naciśnij `Ctrl+Shift+P` w VSC i wyszukaj jedną z komend:

| Komenda | Opis |
|---|---|
| `Ollama: Open Chat Panel` | Otwiera panel czatu (streaming) |
| `Ollama: Ask about selection` | Zaznacz kod → wyjaśnij przez Ollama |
| `Ollama: Send prompt to Terminal` | Wysyła zapytanie przez `docker exec` w terminalu VS Code |
| `Ollama: Change Model` | Wybiera model z listy dostępnych lokalnie |

---
## Używanie ollama w terminalu CMD
```powershell
cmd
docker exec -it ollama ollama run llama3
```
## Ustawienia wtyczki

Przejdź do **File → Preferences → Settings** i wyszukaj `ollama`, aby skonfigurować:

| Ustawienie | Domyślna wartość | Opis |
|---|---|---|
| `ollama.baseUrl` | `http://localhost:11434` | Adres API Ollamy |
| `ollama.model` | `llama3` | Domyślny model |
| `ollama.temperature` | `0.7` | Kreatywność odpowiedzi (0–1) |

## Ograniczenie odpowiedzialności
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND... IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY...

OPROGRAMOWANIE JEST DOSTARCZANE „TAKIE, JAKIE JEST”, BEZ ŻADNEJ GWARANCJI... W ŻADNYM WYPADKU AUTOR ANI POSIADACZE PRAW AUTORSKICH NIE PONOSZĄ ODPOWIEDZIALNOŚCI ZA ŻADNE ROSZCZENIA, SZKODY ANI INNĄ ODPOWIEDZIALNOŚĆ...
