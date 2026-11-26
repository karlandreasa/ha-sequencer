"""[MS-RSP] InitShutdown interface structures for impacket.

Imported lazily (only when a Windows shutdown is requested), because impacket is
installed on first use. impacket looks up '<Request>Response' in the request's module,
so both classes must live at module level here.
"""

from impacket.dcerpc.v5.dtypes import BOOLEAN, DWORD, PRPC_UNICODE_STRING, PWCHAR
from impacket.dcerpc.v5.ndr import NDRCALL


class BaseInitiateShutdownEx(NDRCALL):  # [MS-RSP] 3.2.4.3, opnum 2
    opnum = 2
    structure = (
        ("ServerName", PWCHAR),
        ("lpMessage", PRPC_UNICODE_STRING),
        ("dwTimeout", DWORD),
        ("bForceAppsClosed", BOOLEAN),
        ("bRebootAfterShutdown", BOOLEAN),
        ("dwReason", DWORD),
    )


class BaseInitiateShutdownExResponse(NDRCALL):
    structure = (("ErrorCode", DWORD),)
