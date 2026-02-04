import os
import time

import serial
from serial import SerialException


def _read_line(ser: serial.Serial, deadline: float) -> str | None:
    while time.monotonic() < deadline:
        data = ser.readline()
        if not data:
            continue
        return data.decode("utf-8", errors="ignore").strip()
    return None


def send_frame(frame: bytes) -> None:
    port = os.getenv("UART_PORT")
    if not port:
        raise RuntimeError("UART_PORT is not set")

    baudrate = int(os.getenv("UART_BAUD", "115200"))
    timeout = float(os.getenv("UART_TIMEOUT", "1"))
    response_timeout = float(os.getenv("UART_RESPONSE_TIMEOUT", "10"))
    done_timeout = float(os.getenv("UART_DONE_TIMEOUT", "60"))

    try:
        with serial.Serial(port=port, baudrate=baudrate, timeout=timeout) as ser:
            ser.write(frame)
            ser.flush()

            deadline = time.monotonic() + response_timeout
            received = _read_line(ser, deadline)
            if not received or received.lower() != "received":
                raise RuntimeError("No 'received' confirmation from ESP32")

            done_deadline = time.monotonic() + done_timeout
            done = _read_line(ser, done_deadline)
            if not done or done.lower() != "done":
                raise RuntimeError("No 'Done' confirmation from ESP32")
    except SerialException as exc:
        raise RuntimeError(f"UART error: {exc}") from exc
