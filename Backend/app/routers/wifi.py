import os
import shutil
import threading
import re
import subprocess
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from .. import models, schemas
from .users import get_current_user

router = APIRouter()
DISCONNECT_AFTER_SECONDS = 60 * 60 * 12
_disconnect_timer: threading.Timer | None = None


def _scan_with_nmcli() -> List[schemas.WifiNetwork]:
    try:
        result = subprocess.run(
            ["nmcli", "-t", "-f", "SSID,SIGNAL,SECURITY,BSSID,FREQ", "dev", "wifi"],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="ignore",
            check=False,
        )
    except FileNotFoundError:
        return []
    if result.returncode != 0:
        return []

    networks: List[schemas.WifiNetwork] = []
    for line in result.stdout.splitlines():
        if not line.strip():
            continue
        parts = re.split(r"(?<!\\):", line)
        if len(parts) < 5:
            continue
        ssid, signal, security, bssid, freq = parts[:5]
        ssid = ssid.replace("\\:", ":").replace("\\\\", "\\")
        signal_value = int(signal) if signal.isdigit() else None
        freq_value = int(freq) if freq.isdigit() else None
        networks.append(
            schemas.WifiNetwork(
                ssid=ssid,
                signal=signal_value,
                security=security or None,
                bssid=bssid or None,
                frequency=freq_value,
            )
        )
    return networks


def _scan_with_netsh() -> List[schemas.WifiNetwork]:
    try:
        result = subprocess.run(
            ["netsh", "wlan", "show", "networks", "mode=bssid"],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="ignore",
            check=False,
        )
    except FileNotFoundError:
        return []
    if result.returncode != 0:
        return []

    networks: List[schemas.WifiNetwork] = []
    current: dict | None = None
    for raw_line in result.stdout.splitlines():
        line = raw_line.strip()
        ssid_match = re.match(r"^SSID\s+\d+\s*:\s*(.*)$", line)
        if ssid_match:
            if current:
                networks.append(schemas.WifiNetwork(**current))
            ssid = ssid_match.group(1).strip()
            current = {
                "ssid": ssid,
                "signal": None,
                "security": None,
                "bssid": None,
                "frequency": None,
            }
            continue

        if current is None:
            continue

        signal_match = re.match(r"^Signal\s*:\s*(\d+)%$", line)
        if signal_match:
            current["signal"] = int(signal_match.group(1))
            continue

        auth_match = re.match(r"^Authentication\s*:\s*(.+)$", line)
        if auth_match:
            current["security"] = auth_match.group(1).strip()
            continue

        bssid_match = re.match(r"^BSSID\s+\d+\s*:\s*(.+)$", line)
        if bssid_match and not current.get("bssid"):
            current["bssid"] = bssid_match.group(1).strip()
            continue

    if current:
        networks.append(schemas.WifiNetwork(**current))

    return networks


def scan_wifi_networks() -> List[schemas.WifiNetwork]:
    try:
        if os.name == "nt":
            if not shutil.which("netsh"):
                return []
            networks = _scan_with_netsh()
        else:
            if not shutil.which("nmcli"):
                return []
            networks = _scan_with_nmcli()
    except Exception:
        return []
    return sorted(networks, key=lambda n: n.signal or 0, reverse=True)


def _run_nmcli(args: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["nmcli", *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="ignore",
        check=False,
    )


def _get_wifi_device() -> str | None:
    result = _run_nmcli(["-t", "-f", "DEVICE,TYPE,STATE", "device"])
    if result.returncode != 0:
        return None
    for line in result.stdout.splitlines():
        parts = line.split(":")
        if len(parts) < 3:
            continue
        device, dev_type, state = parts[:3]
        if dev_type == "wifi":
            return device
    return None


def _disconnect_wifi() -> None:
    device = _get_wifi_device()
    if not device:
        return
    _run_nmcli(["device", "disconnect", device])


def _schedule_disconnect() -> None:
    global _disconnect_timer
    if _disconnect_timer:
        _disconnect_timer.cancel()
    _disconnect_timer = threading.Timer(DISCONNECT_AFTER_SECONDS, _disconnect_wifi)
    _disconnect_timer.daemon = True
    _disconnect_timer.start()


@router.get("/networks", response_model=List[schemas.WifiNetwork])
def list_wifi_networks(
    current_user: models.User = Depends(get_current_user),
):
    return scan_wifi_networks()


@router.post("/connect", response_model=schemas.WifiConnectResponse)
def connect_wifi(
    payload: schemas.WifiConnectRequest,
    current_user: models.User = Depends(get_current_user),
):
    if os.name != "posix" or not shutil.which("nmcli"):
        raise HTTPException(status_code=501, detail="WiFi connect not supported")

    args = ["dev", "wifi", "connect", payload.ssid]
    if payload.password:
        args += ["password", payload.password]

    result = _run_nmcli(args)
    if result.returncode != 0:
        detail = result.stderr.strip() or "WiFi connection failed"
        raise HTTPException(status_code=400, detail=detail)

    _schedule_disconnect()
    return schemas.WifiConnectResponse(
        ssid=payload.ssid,
        status="connected",
        expires_in_seconds=DISCONNECT_AFTER_SECONDS,
    )
