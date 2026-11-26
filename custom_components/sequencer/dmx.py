"""DMX output over the network: Art-Net (ArtDmx) and sACN (E1.31), with fades.

Every universe that has been written to is re-sent once per second (sACN receivers
drop a source after 2.5 s without data) and at ~30 fps while a fade is running.
"""

from __future__ import annotations

import asyncio
import contextlib
import logging
import re
import socket
import struct
import time
import uuid

from homeassistant.core import HomeAssistant

from .i18n import identity

_LOGGER = logging.getLogger(__name__)

ARTNET_PORT = 6454
SACN_PORT = 5568
FADE_FPS = 30

_PART = re.compile(r"(\d+)(?:\s*-\s*(\d+))?\s*[=:]\s*(\d+(?:[.,]\d+)?)\s*(%)?")


def parse_channels(text: str | None, tr=identity) -> dict[int, int]:
    """'1=255, 2-4=50%, 10:128' -> {1: 255, 2: 128, 3: 128, 4: 128, 10: 128}."""
    out: dict[int, int] = {}
    for part in re.split(r"[,;\n]+", text or ""):
        part = part.strip()
        if not part:
            continue
        m = _PART.fullmatch(part)
        if not m:
            raise ValueError(tr("Kan inte tolka '{part}' – skriv t.ex. 1=255, 2-4=50%", part=part))
        first = int(m[1])
        last = int(m[2] or first)
        value = float(m[3].replace(",", "."))
        if m[4]:
            value = value * 255 / 100
        if not 1 <= first <= last <= 512:
            raise ValueError(tr("Kanal utanför 1–512 i '{part}'", part=part))
        if not 0 <= value <= 255:
            raise ValueError(tr("Värde utanför 0–255 (0–100 %) i '{part}'", part=part))
        for ch in range(first, last + 1):
            out[ch] = int(round(value))
    return out


def artnet_packet(seq: int, universe: int, data: bytes) -> bytes:
    return (
        b"Art-Net\x00"
        + struct.pack("<H", 0x5000)  # OpDmx
        + struct.pack(">H", 14)  # protocol version
        + bytes([seq, 0])  # sequence, physical
        + struct.pack("<H", universe & 0x7FFF)  # SubUni + Net
        + struct.pack(">H", len(data))
        + data
    )


def sacn_packet(cid: bytes, seq: int, universe: int, data: bytes, name: bytes = b"HA Sequencer") -> bytes:
    n = len(data) + 1  # start code + slots
    dmp = struct.pack(">HBBHHH", 0x7000 | (10 + n), 0x02, 0xA1, 0x0000, 0x0001, n) + b"\x00" + data
    framing = (
        struct.pack(">HI", 0x7000 | (77 + len(dmp)), 0x00000002)
        + name[:63].ljust(64, b"\x00")
        + struct.pack(">BHBBH", 100, 0, seq, 0, universe)
        + dmp
    )
    return (
        struct.pack(">HH", 0x0010, 0x0000)
        + b"ASC-E1.17\x00\x00\x00"
        + struct.pack(">HI", 0x7000 | (22 + len(framing)), 0x00000004)
        + cid
        + framing
    )


class _Universe:
    def __init__(self, protocol: str, host: str, universe: int) -> None:
        self.protocol = protocol
        self.host = host
        self.universe = universe
        self.data = [0.0] * 512
        self.fades: dict[int, tuple[float, float, float, float]] = {}
        self.seq = 0

    @property
    def address(self) -> tuple[str, int]:
        if self.protocol == "sacn":
            host = self.host or f"239.255.{(self.universe >> 8) & 0xFF}.{self.universe & 0xFF}"
            return host, SACN_PORT
        return self.host or "255.255.255.255", ARTNET_PORT


class DmxEngine:
    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._universes: dict[tuple[str, str, int], _Universe] = {}
        self._task: asyncio.Task | None = None
        self._wake = asyncio.Event()
        self._sock: socket.socket | None = None
        self._cid = uuid.uuid4().bytes

    def _socket(self) -> socket.socket:
        if self._sock is None:
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
            sock.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 4)
            sock.setblocking(False)
            self._sock = sock
        return self._sock

    def universe(self, protocol: str, host: str, universe: int) -> _Universe:
        key = (protocol, (host or "").strip(), int(universe))
        if key not in self._universes:
            self._universes[key] = _Universe(*key)
        return self._universes[key]

    async def async_set(self, protocol: str, host: str, universe: int, values: dict[int, int], fade: float) -> None:
        u = self.universe(protocol, host, universe)
        now = time.monotonic()
        for ch, value in values.items():
            idx = ch - 1
            if fade > 0:
                u.fades[idx] = (u.data[idx], float(value), now, fade)
            else:
                u.fades.pop(idx, None)
                u.data[idx] = float(value)
        if self._task is None or self._task.done():
            self._task = self.hass.async_create_background_task(self._loop(), "sequencer_dmx")
        self._wake.set()

    async def _loop(self) -> None:
        while True:
            now = time.monotonic()
            fading = False
            for u in self._universes.values():
                for idx, (start, target, t0, dur) in list(u.fades.items()):
                    p = min(1.0, (now - t0) / dur)
                    u.data[idx] = start + (target - start) * p
                    if p >= 1:
                        del u.fades[idx]
                    else:
                        fading = True
                self._send(u)
            self._wake.clear()
            with contextlib.suppress(TimeoutError):
                async with asyncio.timeout(1 / FADE_FPS if fading else 1.0):
                    await self._wake.wait()

    def _send(self, u: _Universe) -> None:
        data = bytes(int(round(max(0.0, min(255.0, v)))) for v in u.data)
        u.seq = u.seq % 255 + 1
        if u.protocol == "sacn":
            pkt = sacn_packet(self._cid, u.seq, u.universe, data)
        else:
            pkt = artnet_packet(u.seq, u.universe, data)
        try:
            self._socket().sendto(pkt, u.address)
        except OSError as err:
            _LOGGER.debug("DMX send to %s failed: %s", u.address, err)

    async def async_stop(self) -> None:
        if self._task:
            self._task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._task
        if self._sock:
            self._sock.close()
            self._sock = None
