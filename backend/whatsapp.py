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


def send_whatsapp_template(phone_number: str, template_name: str = "bienvenida_migalleria", language: str = "es") -> dict:
    if not WHATSAPP_TOKEN or not WHATSAPP_PHONE_ID:
        logger.error("WHATSAPP_TOKEN o WHATSAPP_PHONE_ID no configurados")
        return {"error": "WhatsApp no configurado"}

    clean_number = phone_number.replace("+", "").replace(" ", "").replace("-", "").replace("(", "").replace(")", "")

    if len(clean_number) == 10 and clean_number[:3] in ["829", "849", "809"]:
        clean_number = "1" + clean_number

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
