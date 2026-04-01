"""
Script para enviar mensaje de bienvenida por WhatsApp a todos los usuarios existentes.
Ejecutar: python send_welcome_all.py
"""
import os
import sys
import time
import argparse
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

from whatsapp import send_whatsapp_template

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "test_database")

if not MONGO_URL:
    print("ERROR: MONGO_URL no configurado en .env")
    sys.exit(1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--template", type=str, default="bienvenida_soporte")
    args = parser.parse_args()

    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]

    query = {
        "telefono": {"$exists": True, "$nin": [None, ""]},
        "whatsapp_welcome_sent": {"$ne": True},
    }

    users = list(db.users.find(query).sort("created_at", -1))
    total = len(users)

    print(f"\nUsuarios pendientes de mensaje WhatsApp: {total}")

    if args.dry_run:
        print("(Modo dry-run, no se enviarán mensajes)")
        for u in users[:10]:
            print(f"  - {u.get('nombre', 'Sin nombre')} | {u.get('telefono')}")
        if total > 10:
            print(f"  ... y {total - 10} más")
        return

    if args.limit > 0:
        users = users[:args.limit]
        print(f"Limitado a {args.limit} usuarios")

    enviados = 0
    errores = 0

    for i, user in enumerate(users):
        telefono = user.get("telefono", "")
        nombre = user.get("nombre", "Sin nombre")

        if not telefono or len(telefono) < 7:
            print(f"[{i+1}/{len(users)}] SKIP {nombre} - teléfono inválido: {telefono}")
            continue

        print(f"[{i+1}/{len(users)}] Enviando a {nombre} ({telefono})...", end=" ")

        result = send_whatsapp_template(telefono, template_name=args.template)

        if "error" not in result and "messages" in result:
            print("OK")
            enviados += 1
            db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"whatsapp_welcome_sent": True}}
            )
        else:
            error_msg = result.get("error", {})
            if isinstance(error_msg, dict):
                error_msg = error_msg.get("message", str(error_msg))
            print(f"ERROR - {error_msg}")
            errores += 1

        time.sleep(1)

    print(f"\nCompletado: {enviados} enviados, {errores} errores")


if __name__ == "__main__":
    main()