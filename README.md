# Zautomatyzowany system dozowania napojów

Kompletny system do zarzadzania i obslugi automatu do drinkow:

- backend API (FastAPI + PostgreSQL),
- web frontend (React + Vite),
- aplikacja mobilna (Expo/React Native),
- firmware ESP32 sterujacy wykonaniem porcji.

## Spis tresci

1. [Architektura](#architektura)
2. [Technologie](#technologie)
3. [Funkcjonalnosci](#funkcjonalnosci)
4. [Struktura repozytorium](#struktura-repozytorium)
5. [Wymagania](#wymagania)
6. [Konfiguracja srodowiska](#konfiguracja-srodowiska)
7. [Uruchomienie Docker Compose](#uruchomienie-docker-compose)
8. [Uruchomienie lokalne bez Dockera](#uruchomienie-lokalne-bez-dockera)
9. [API - najwazniejsze endpointy](#api---najwazniejsze-endpointy)
10. [UART i integracja z ESP32](#uart-i-integracja-z-esp32)
11. [Aplikacja mobilna](#aplikacja-mobilna)
12. [Troubleshooting](#troubleshooting)

## Architektura

- `Backend/` - API, autoryzacja JWT, logika drinkow, konfiguracja slotow, WiFi, wysylka ramek UART.
- `Frontend/` - panel web do logowania, zarzadzania drinkami, ulubionymi, slotami i WiFi.
- `DrinkMasterApp/` - aplikacja mobilna (Expo) korzystajaca z tego samego API.
- `ESP/` - firmware ESP32 odbierajacy ramki przez UART i wykonujacy sekwencje nalewania.
- `db-init/` - skrypty SQL tworzenia schematu i danych startowych.

## Technologie

- Backend: FastAPI, SQLAlchemy, PostgreSQL, Passlib (bcrypt), python-jose (JWT), pyserial.
- Frontend WWW: React 19, TypeScript, Vite, Tailwind CSS, Axios.
- Mobile: Expo, React Native, Expo Router.
- Firmware: ESP32 (Arduino framework), AccelStepper, HX711.
- Infra: Docker Compose (PostgreSQL + Backend + pgAdmin).

## Funkcjonalnosci

- Rejestracja, logowanie i profile uzytkownikow (`/users/*`).
- JWT auth z Bearer token.
- Role `USER` / `ADMIN` (czesc endpointow tylko dla admina).
- CRUD drinkow z uploadem zdjec.
- Lista drinkow dostepnych wg aktualnie aktywnych slotow/fillerow.
- Ulubione drinki per uzytkownik.
- Konfiguracja slotow maszyny (`machine_slots` i `machine_fillers`).
- Skanowanie WiFi i laczenie z siecia (`nmcli` na Linux, skan `netsh` na Windows).
- Generowanie i wysylka ramek UART do ESP32.

## Struktura repozytorium

```text
.
|- Backend/
|  |- app/
|  |  |- main.py
|  |  |- database.py
|  |  |- models.py
|  |  |- schemas.py
|  |  |- routers/
|  |  |- services/
|  |- requirements.txt
|  |- Dockerfile
|- Frontend/
|- DrinkMasterApp/
|- ESP/
|- db-init/
|- docker-compose.yml
|- .env
```

## Wymagania

- Docker + Docker Compose (zalecane), albo:
- Python 3.12+
- Node.js 20+
- PostgreSQL 16+
- (opcjonalnie) Arduino IDE / PlatformIO dla ESP32

## Konfiguracja srodowiska

Projekt korzysta z `.env` w katalogu glownym. Najwazniejsze zmienne:

### Baza danych

- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`
- `DATABASE_HOST`
- `DATABASE_PORT`

### Porty / host

- `BACKEND_PORT`
- `FRONTEND_PORT`
- `POSTGRES_PORT`
- `PGADMIN_PORT`
- `PLATFORM_URL`

### Frontend web

- `VITE_API_URL` (np. `http://localhost:8000`)

### Backend auth

- `JWT_SECRET`
- `ACCESS_TOKEN_EXPIRE_MINUTES`

### Backend CORS

- `CORS_ORIGINS` (CSV, np. `http://localhost:5173,http://127.0.0.1:5173`)

### UART (ESP32)

- `UART_PORT` (np. `/dev/ttyUSB0` lub `COM5`)
- `UART_BAUD` (domyslnie `115200`)
- `UART_TIMEOUT`
- `UART_RESPONSE_TIMEOUT`
- `UART_DONE_TIMEOUT`

### Expo mobile

- `EXPO_PUBLIC_API_URL`

Uwaga:

- W kodzie backendu uzywane sa `JWT_SECRET` i `ACCESS_TOKEN_EXPIRE_MINUTES`.
- Jezeli masz tylko `JWT_SECRET_KEY` i `JWT_EXPIRES_IN` w `.env`, backend ich nie wykorzysta bez dodatkowego mapowania.

## Uruchomienie Docker Compose

1. Upewnij sie, ze `.env` ma poprawne wartosci.
2. Uruchom:

```bash
docker compose up --build
```

3. Dostepy domyslne:

- Backend API: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- pgAdmin: `http://localhost:5050`
- PostgreSQL: `localhost:5432`

Uwaga Linux/macOS:

- `docker-compose.yml` wskazuje `./backend`, a katalog w repo to `Backend/`.
- Na systemach case-sensitive trzeba poprawic sciezke na `./Backend`.

## Uruchomienie lokalne bez Dockera

### 1. Backend

```bash
cd Backend
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend web

```bash
cd Frontend
npm install
npm run dev
```

Wymagane: `Frontend/.env` z poprawnym `VITE_API_URL`.

### 3. Mobile (Expo)

```bash
cd DrinkMasterApp
npm install
npm run start
```

Wymagane: `DrinkMasterApp/.env` z poprawnym `EXPO_PUBLIC_API_URL`.

## API - najwazniejsze endpointy

Base URL: `http://<host>:<BACKEND_PORT>`

### Uzytkownicy (`/users`)

- `POST /users/register`
- `POST /users/login`
- `GET /users/me` (Bearer)
- `PUT /users/me` (Bearer)
- `PUT /users/me/password` (Bearer)

### Drinki (`/drinks`)

- `POST /drinks/` (Bearer, multipart/form-data)
- `PUT /drinks/{drink_id}` (Bearer, multipart/form-data)
- `GET /drinks/`
- `GET /drinks/available`
- `GET /drinks/my` (Bearer)
- `GET /drinks/{drink_id}`
- `DELETE /drinks/{drink_id}` (Bearer)

### Skladniki i maszyna (`/ingredients`)

- `POST /ingredients/alcohols` (ADMIN)
- `GET /ingredients/alcohols`
- `POST /ingredients/mixers` (ADMIN)
- `GET /ingredients/mixers`
- `GET /ingredients/machine_slots`
- `PUT /ingredients/machine_slots/{slot_number}` (ADMIN)
- `GET /ingredients/machine_fillers`
- `PUT /ingredients/machine_fillers/{slot_number}` (ADMIN)

### Ulubione (`/favorite_drinks`)

- `GET /favorite_drinks` (Bearer)
- `POST /favorite_drinks/{drink_id}` (Bearer)
- `DELETE /favorite_drinks/{drink_id}` (Bearer)

### UART (`/frame`)

- `GET /frame/drink_frame/{drink_id}`
- `POST /frame/drink_frame/{drink_id}/send`

### WiFi (`/wifi`)

- `GET /wifi/networks` (Bearer)
- `POST /wifi/connect` (Bearer)

## UART i integracja z ESP32

Backend (`Backend/app/services/uart.py`) otwiera port przez `pyserial` przy kazdym `send_frame()` i czeka na 2 potwierdzenia tekstowe z ESP32:

- `received`
- `Done`

Format ramki:

- para `slot, ml` + separator `0xFF`
- koniec ramki: dodatkowe `0xFF`

Przyklad:

```text
[1, 50, 255, 7, 120, 255, 255]
```

ESP32 (`ESP/main.cpp`) parsuje te ramki i realizuje dozowanie:

- sloty `1..6`: ruch mechaniczny X/Z,
- sloty `7..10`: pompy przekaznikowe,
- po wykonaniu wysyla `Done`.

## Aplikacja mobilna

Aplikacja w `DrinkMasterApp/` korzysta z tego samego API co frontend web.
Kluczowa zmienna:

- `EXPO_PUBLIC_API_URL=http://<ip_lub_host>:8000`

Dla testow na telefonie podaj adres dostepny z sieci lokalnej (nie `localhost`).

## Troubleshooting

- `401 Unauthorized`:
  - sprawdz token Bearer i czy frontend zapisuje `access_token`.
- Brak polaczenia frontend-backend:
  - zweryfikuj `VITE_API_URL` / `EXPO_PUBLIC_API_URL`.
- `UART_PORT is not set`:
  - ustaw `UART_PORT` w srodowisku backendu.
- Docker build nie widzi backendu:
  - popraw `./backend` na `./Backend` w `docker-compose.yml` na systemach case-sensitive.
- Bledy JWT po starcie:
  - ustaw `JWT_SECRET` (nie tylko `JWT_SECRET_KEY`).
