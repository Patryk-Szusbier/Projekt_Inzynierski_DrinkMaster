# Raspberry Pi OS (bez Dockera) - instrukcja instalacji krok po kroku

Poniżej znajdziesz pełne kroki, aby uruchomić Backend (FastAPI), bazę danych (PostgreSQL) i Frontend (Vite)
na Raspberry Pi OS, produkcyjnie, oraz z dostepem przez mDNS (np. drinkmaster.local).

Zakladam, ze repozytorium jest sklonowane na Raspberry Pi w:
`/home/pi/Projekt_Inzynierski_DrinkMaster`

---

## 1. Ustal hostname i wlacz mDNS

1) Zainstaluj Avahi (mDNS):
```
sudo apt update
sudo apt install -y avahi-daemon
sudo systemctl enable --now avahi-daemon
```

2) (Opcjonalnie) Zmien nazwe hosta na `drinkmaster`:
```
sudo hostnamectl set-hostname drinkmaster
sudo reboot
```

Po restarcie urzadzenie bedzie dostepne jako `drinkmaster.local`.

---

## 2. Zainstaluj PostgreSQL i wystaw w sieci

1) Instalacja:
```
sudo apt install -y postgresql
```

2) Utworz uzytkownika i baze (zgodnie z .env):
```
sudo -u postgres psql
CREATE USER drinkuser WITH PASSWORD 'drinkpass';
CREATE DATABASE drinkmachine OWNER drinkuser;
\q
```

3) Ustaw nasluchiwanie na wszystkich interfejsach:
```
sudo nano /etc/postgresql/*/main/postgresql.conf
```
Ustaw:
```
listen_addresses = '*'
```

4) Zezwol na polaczenia z sieci lokalnej:
```
sudo nano /etc/postgresql/*/main/pg_hba.conf
```
Dodaj (najlepiej dopasuj podsiec do swojej; ponizej kilka wariantow):
```
host    all     all     192.168.1.0/24    md5
```
Lub bardziej ogolnie (gdy nie znasz podsieci z gory, ale to mniej bezpieczne):
```
host    all     all     192.168.0.0/16    md5
```
```
host    all     all     10.0.0.0/8        md5
```
Ostatecznie (niezalecane, otwiera baze na wszystkie adresy IPv4):
```
host    all     all     0.0.0.0/0         md5
```
W praktyce: ustaw jak najszerszy zakres, ale tylko taki, jakiego naprawde potrzebujesz.

5) Restart:
```
sudo systemctl restart postgresql
```

---

## 2a. Zaloz schemat i dane z db-init

Pliki w `db-init` to SQL dla schematu i przykladowych danych. Uruchom je w tej kolejnosci:
```
cd /home/pi/Projekt_Inzynierski_DrinkMaster
psql -h 127.0.0.1 -U drinkuser -d drinkmachine -f db-init/01_schema.sql
psql -h 127.0.0.1 -U drinkuser -d drinkmachine -f db-init/sample_data.sql
```

Uwaga: te pliki wprowadzaja przykladowe dane. Jesli chcesz tylko strukture tabel, uruchom tylko `01_schema.sql`.

---

## 3. Skonfiguruj .env

W pliku `.env` w katalogu repozytorium ustaw:
```
PLATFORM_URL=drinkmaster.local
VITE_API_URL=http://drinkmaster.local:8000
API_URL=http://drinkmaster.local:8000
DATABASE_HOST=127.0.0.1
```

Uwaga: `DATABASE_HOST=127.0.0.1` jest prawidlowe, bo backend i baza sa na tym samym Raspberry Pi.

---

## 4. Backend (FastAPI) jako usluga systemd

1) Zainstaluj Pythona i zaleznosci:
```
sudo apt update
sudo apt install -y python3 python3-venv python3-pip
cd /home/pi/Projekt_Inzynierski_DrinkMaster/Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2) Migracje:
```
alembic upgrade head
```

3) Utworz usluge:
```
sudo nano /etc/systemd/system/drinkmaster-backend.service
```
Wklej:
```
[Unit]
Description=DrinkMaster FastAPI
After=network.target postgresql.service

[Service]
User=pi
WorkingDirectory=/home/pi/Projekt_Inzynierski_DrinkMaster/Backend
EnvironmentFile=/home/pi/Projekt_Inzynierski_DrinkMaster/.env
ExecStart=/home/pi/Projekt_Inzynierski_DrinkMaster/Backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

4) Uruchom:
```
sudo systemctl daemon-reload
sudo systemctl enable --now drinkmaster-backend
```

---

## 5. Frontend (Vite) produkcyjnie przez Nginx

1) Zbuduj frontend:
```
cd /home/pi/Projekt_Inzynierski_DrinkMaster/Frontend
npm ci
npm run build
```

2) Zainstaluj Nginx:
```
sudo apt install -y nginx
```

3) Konfiguracja serwera:
```
sudo nano /etc/nginx/sites-available/drinkmaster
```
Wklej:
```
server {
    listen 80;
    server_name drinkmaster.local;

    root /home/pi/Projekt_Inzynierski_DrinkMaster/Frontend/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

4) Aktywuj:
```
sudo ln -s /etc/nginx/sites-available/drinkmaster /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 6. Firewall (jezeli wlaczony)

```
sudo ufw allow 80
sudo ufw allow 8000
sudo ufw allow 5432
```

---

## 7. Test w sieci

Z innego urzadzenia w tej samej sieci Wi-Fi:
```
ping drinkmaster.local
```
Frontend:
```
http://drinkmaster.local
```
Backend:
```
http://drinkmaster.local:8000
```

---

## 8. Typowe problemy

1) `drinkmaster.local` nie dziala na Windows:
   - Zainstaluj Bonjour (Apple) albo uzyj bezposredniego IP Raspberry Pi.

2) Frontend nie widzi backendu:
   - Sprawdz `.env` i wartosci `PLATFORM_URL`, `VITE_API_URL`, `API_URL`.

3) Postgres odrzuca polaczenia z sieci:
   - Sprawdz `pg_hba.conf` i podsiec.

---

## 9. X11 + Onboard + kalibracja dotyku (gdy Wayland nie dziala)

### 9.1 Przelaczenie na X11

1) Uruchom konfigurator:
```
sudo raspi-config
```
2) Wejdz: `Advanced Options` -> `Wayland` -> `X11`
3) Restart:
```
sudo reboot
```

### 9.2 Onboard (klawiatura ekranowa z auto-show)

1) Instalacja:
```
sudo apt update
sudo apt install -y onboard
```
2) Uruchom Onboard i wlacz auto-show:
```
onboard
```
W ustawieniach Onboard: `Preferences` -> `General` -> zaznacz `Auto-show when editing text`.

3) Autostart Onboard (X11):
```
mkdir -p /home/drinkmaster/.config/autostart
nano /home/drinkmaster/.config/autostart/onboard.desktop
```
Wklej:
```
[Desktop Entry]
Type=Application
Name=Onboard
Exec=onboard
X-GNOME-Autostart-enabled=true
```

### 9.3 Kalibracja ekranu dotykowego (X11)

1) Zainstaluj kalibrator:
```
sudo apt update
sudo apt install -y xinput-calibrator
```

2) Uruchom kalibracje:
```
xinput_calibrator
```
Zobaczysz wynik z liniami `Option "Calibration"` i `Option "SwapAxes"`.

3) Dodaj wynik do konfiguracji X11:
```
sudo nano /etc/X11/xorg.conf.d/99-calibration.conf
```
Wklej (przyklad - wstaw swoje wartosci):
```
Section "InputClass"
    Identifier "calibration"
    MatchProduct "Twoj_Touchscreen"
    Option "Calibration" "123 3900 250 3800"
    Option "SwapAxes" "0"
EndSection
```

4) Restart:
```
sudo reboot
```

Uwaga: jesli nie znasz nazwy urzadzenia dotykowego, sprawdz:
```
xinput list
```
