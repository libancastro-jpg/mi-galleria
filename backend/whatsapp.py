"""
WhatsApp Cloud API - Módulo para Mi Galleria
"""
import os
import requests
import logging

logger = logging.getLogger(__name__)

WHATSAPP_TOKEN = os.environ.get("WHATSAPP_TOKEN")
WHATSAPP_PHONE_ID = os.environ.get("WHATSAPP_PHONE_ID")
WHATSAPP_API_URL = f"https://graph.facebook.com/v22.0/{WHATSAPP_PHONE_ID}/messages"

# Media ID de la imagen del banner (800x418px)
BANNER_MEDIA_ID = "1728927351813272"

# Tabla de países: dial_code → expected total length (code + local digits)
# Used to detect whether a number already includes its country code.
_COUNTRY_TOTAL_LENGTHS: dict[str, list[int]] = {
    "1":   [11],        # RD, US, PR  (1 + 10)
    "57":  [12],        # Colombia    (57 + 10)
    "52":  [12],        # México      (52 + 10)
    "58":  [12],        # Venezuela   (58 + 10)
    "51":  [11],        # Perú        (51 + 9)
    "56":  [11],        # Chile       (56 + 9)
    "53":  [10],        # Cuba        (53 + 8)
    "507": [11],        # Panamá      (507 + 8)
    "593": [12, 13],    # Ecuador     (593 + 9 or 10)
    "504": [11],        # Honduras    (504 + 8)
    "502": [11],        # Guatemala   (502 + 8)
    "503": [11],        # El Salvador (503 + 8)
    "505": [11],        # Nicaragua   (505 + 8)
    "506": [11],        # Costa Rica  (506 + 8)
}


def normalize_phone_number(phone_number: str, default_country_code: str = "1") -> str:
    """
    Returns a clean E.164-style number string (no '+', no spaces) ready for
    WhatsApp / Infobip. Adds a country code when the raw number lacks one.

    Detection order:
    1. Strip non-digits.
    2. Check against known country-code prefixes (longest match first).
       If the resulting total length matches the expected length for that
       prefix, the number already has a country code → return as-is.
    3. Heuristic fallback for numbers without a code:
       - 10 digits starting with 809/829/849 → prepend "1" (Dominican Republic)
       - 10 digits starting with "3"          → prepend "57" (Colombia)
       - Otherwise prepend default_country_code.
    """
    if not phone_number:
        return phone_number

    digits = (
        phone_number
        .replace("+", "")
        .replace(" ", "")
        .replace("-", "")
        .replace("(", "")
        .replace(")", "")
    )

    if not digits:
        return phone_number

    # Try longest dial codes first (3-digit codes before 2-digit before 1-digit)
    for code_len in (3, 2, 1):
        prefix = digits[:code_len]
        if prefix in _COUNTRY_TOTAL_LENGTHS:
            expected_lengths = _COUNTRY_TOTAL_LENGTHS[prefix]
            if len(digits) in expected_lengths:
                logger.debug(
                    "[normalize_phone] Already has country code +%s → %s",
                    prefix, digits,
                )
                return digits

    # No country code detected — apply heuristics
    if len(digits) == 10 and digits[:3] in ("809", "829", "849"):
        normalized = "1" + digits
        logger.debug("[normalize_phone] RD heuristic → %s", normalized)
        return normalized

    if len(digits) == 10 and digits[0] == "3":
        normalized = "57" + digits
        logger.debug("[normalize_phone] Colombia heuristic → %s", normalized)
        return normalized

    normalized = default_country_code + digits
    logger.debug(
        "[normalize_phone] Default code +%s → %s",
        default_country_code, normalized,
    )
    return normalized


def send_whatsapp_template(phone_number: str, template_name: str = "bienvenida_migalleria", language: str = "es") -> dict:
    if not WHATSAPP_TOKEN or not WHATSAPP_PHONE_ID:
        logger.error("WHATSAPP_TOKEN o WHATSAPP_PHONE_ID no configurados")
        return {"error": "WhatsApp no configurado"}

    clean_number = normalize_phone_number(phone_number)

    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json",
    }

    payload = {
        "messaging_product": "whatsapp",
        "to": clean_number,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": language},
            "components": [
                {
                    "type": "header",
                    "parameters": [
                        {
                            "type": "image",
                            "image": {
                                "id": BANNER_MEDIA_ID
                            }
                        }
                    ]
                }
            ]
        },
    }

    try:
        response = requests.post(WHATSAPP_API_URL, json=payload, headers=headers, timeout=30)
        result = response.json()
        if response.status_code == 200:
            logger.info("[WhatsApp] Mensaje enviado a %s", clean_number)
        else:
            logger.error("[WhatsApp] Error enviando a %s: %s", clean_number, result)
        return result
    except Exception as e:
        logger.error("[WhatsApp] Excepción enviando a %s: %s", clean_number, e)
        return {"error": str(e)}
