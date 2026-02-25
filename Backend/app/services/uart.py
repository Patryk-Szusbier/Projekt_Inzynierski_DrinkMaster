import os
import time
import serial
from serial import SerialException


def _wait_for_confirmations(ser: serial.Serial, deadline: float) -> None:
    """
    Wait for ESP confirmations in order:
    1) received
    2) done
    Any other UART lines are ignored as debug logs.
    """
    got_received = False
    recent_lines: list[str] = []

    while time.monotonic() < deadline:
        data = ser.readline()
        if not data:
            continue

        line = data.decode("utf-8", errors="ignore").strip()
        if not line:
            continue

        recent_lines.append(line)
        if len(recent_lines) > 10:
            recent_lines.pop(0)

        low = line.lower()
        if not got_received:
            if low == "received":
                got_received = True
            continue

        if low == "done":
            return

    if not got_received:
        raise RuntimeError(
            "Did not receive 'received' confirmation from ESP32. "
            f"Last UART lines: {recent_lines}"
        )

    raise RuntimeError(
        "Did not receive 'done' confirmation from ESP32 after 'received'. "
        f"Last UART lines: {recent_lines}"
    )


def send_frame(frame: bytes) -> None:
    port = os.getenv("UART_PORT")
    if not port:
        raise RuntimeError("UART_PORT is not set")

    baudrate = int(os.getenv("UART_BAUD", "115200"))
    timeout = float(os.getenv("UART_TIMEOUT", "1"))
    done_timeout = float(os.getenv("UART_DONE_TIMEOUT", "60"))

    try:
        with serial.Serial(port=port, baudrate=baudrate, timeout=timeout) as ser:
            ser.write(frame)
            ser.flush()

            deadline = time.monotonic() + done_timeout
            _wait_for_confirmations(ser, deadline=deadline)

    except SerialException as exc:
        raise RuntimeError(f"UART error: {exc}") from exc
