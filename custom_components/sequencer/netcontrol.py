"""Wake on LAN and Windows remote shutdown (MS-RSP over SMB, like `shutdown /s /m \\\\pc`)."""

from __future__ import annotations

import re
import socket

from homeassistant.core import HomeAssistant
from homeassistant.requirements import async_process_requirements

from .i18n import identity

# Installed on first use only, so the integration still loads if it can't be installed.
IMPACKET_REQUIREMENT = "impacket>=0.12.0"

MSRPC_UUID_INITSHUTDOWN = ("894DE0C0-0D55-11D3-A322-00C04FA321A1", "1.0")
# SHTDN_REASON_FLAG_PLANNED | MAJOR_OTHER | MINOR_OTHER
SHUTDOWN_REASON = 0x80000000


def normalize_mac(mac: str, tr=identity) -> bytes:
    clean = re.sub(r"[^0-9a-fA-F]", "", mac or "")
    if len(clean) != 12:
        raise ValueError(tr("Ogiltig MAC-adress '{mac}'", mac=mac))
    return bytes.fromhex(clean)


def send_magic_packet(mac: str, broadcast: str | None = None, port: int | None = None) -> None:
    packet = b"\xff" * 6 + normalize_mac(mac) * 16
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        for _ in range(3):
            sock.sendto(packet, (broadcast or "255.255.255.255", int(port or 9)))


async def async_ensure_impacket(hass: HomeAssistant) -> None:
    await async_process_requirements(hass, "sequencer.windows_shutdown", [IMPACKET_REQUIREMENT])


def windows_shutdown(
    host: str,
    username: str,
    password: str,
    domain: str = "",
    timeout: int = 0,
    force: bool = True,
    reboot: bool = False,
    tr=identity,
) -> None:
    """Ask a Windows PC to shut down via the InitShutdown RPC interface (\\pipe\\InitShutdown).

    Blocking – run in an executor.
    """
    from impacket.dcerpc.v5 import transport  # noqa: PLC0415
    from impacket.dcerpc.v5.dtypes import NULL  # noqa: PLC0415
    from impacket.uuid import uuidtup_to_bin  # noqa: PLC0415

    from .rsp_ndr import BaseInitiateShutdownEx  # noqa: PLC0415

    rpc = transport.DCERPCTransportFactory(rf"ncacn_np:{host}[\pipe\InitShutdown]")
    rpc.set_credentials(username, password, domain or "", "", "")
    rpc.set_connect_timeout(10)
    dce = rpc.get_dce_rpc()
    dce.connect()
    try:
        dce.bind(uuidtup_to_bin(MSRPC_UUID_INITSHUTDOWN))
        req = BaseInitiateShutdownEx()
        req["ServerName"] = NULL
        req["lpMessage"] = NULL
        req["dwTimeout"] = int(timeout)
        req["bForceAppsClosed"] = 1 if force else 0
        req["bRebootAfterShutdown"] = 1 if reboot else 0
        req["dwReason"] = SHUTDOWN_REASON
        resp = dce.request(req, checkError=False)
        code = resp["ErrorCode"]
        if code not in (0, 0x45B):  # 0x45B = shutdown already in progress
            raise RuntimeError(tr("Windows svarade med felkod 0x{code}", code=f"{code:08X}"))
    finally:
        dce.disconnect()
