from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import jwt
import bcrypt
from bson import ObjectId
import time
import requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mongo_url = os.environ.get("MONGO_URL")

if not mongo_url:
    raise RuntimeError("MONGO_URL is not set in environment variables")

print("Mongo URL loaded:", mongo_url[:25], "...")
db_name = os.environ.get('DB_NAME', 'castador_pro')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

JWT_SECRET = os.environ.get('JWT_SECRET')
if not JWT_SECRET:
    JWT_SECRET = 'castador-pro-secret-key-2025-dev'
    logger.warning("JWT_SECRET not set, using development default. Set JWT_SECRET in production!")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

APPLE_ISSUER_ID = os.environ.get("APPLE_ISSUER_ID")
APPLE_KEY_ID = os.environ.get("APPLE_KEY_ID")
APPLE_BUNDLE_ID = os.environ.get("APPLE_BUNDLE_ID")
APPLE_PRIVATE_KEY_PATH = os.environ.get("APPLE_PRIVATE_KEY_PATH")

app = FastAPI(title="Castador Pro API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# ============== MODELS ==============

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v, info=None):
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str):
            return v
        raise ValueError('Invalid ObjectId')

# User Models
class UserCreate(BaseModel):
    telefono: str
    email: Optional[str] = None
    pin: str
    nombre: Optional[str] = None

class UserLogin(BaseModel):
    telefono: str
    pin: str

class UserResponse(BaseModel):
    id: str
    telefono: str
    email: Optional[str] = None
    nombre: Optional[str] = None
    created_at: datetime
    plan: str = "gratis"
    records_used: int = 0
    premium_expires_at: Optional[datetime] = None
    premium_active: bool = False
    records_limit: Optional[int] = 20

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Ave Models
class AveBase(BaseModel):
    tipo: str  # gallo | gallina
    codigo: str
    nombre: Optional[str] = None
    color_placa: Optional[str] = None
    foto_principal: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    color: Optional[str] = None
    cresta: Optional[str] = None
    linea: Optional[str] = None
    castado_por: Optional[str] = None
    estado: str = "activo"
    notas: Optional[str] = None
    padre_id: Optional[str] = None
    madre_id: Optional[str] = None
    padre_externo: Optional[str] = None
    madre_externo: Optional[str] = None
    marcaje_qr: Optional[str] = None

class AveCreate(AveBase):
    pass

class AveUpdate(BaseModel):
    tipo: Optional[str] = None
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    color_placa: Optional[str] = None
    foto_principal: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    color: Optional[str] = None
    cresta: Optional[str] = None
    linea: Optional[str] = None
    castado_por: Optional[str] = None
    estado: Optional[str] = None
    notas: Optional[str] = None
    padre_id: Optional[str] = None
    madre_id: Optional[str] = None
    padre_externo: Optional[str] = None
    madre_externo: Optional[str] = None
    marcaje_qr: Optional[str] = None
    abuelo_paterno_padre: Optional[str] = None
    abuelo_paterno_padre_galleria: Optional[str] = None
    abuelo_paterno_madre: Optional[str] = None
    abuelo_paterno_madre_galleria: Optional[str] = None
    abuelo_materno_padre: Optional[str] = None
    abuelo_materno_padre_galleria: Optional[str] = None
    abuelo_materno_madre: Optional[str] = None
    abuelo_materno_madre_galleria: Optional[str] = None

class AveResponse(AveBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

# Cruce Models
class CruceBase(BaseModel):
    padre_id: Optional[str] = None
    madre_id: Optional[str] = None
    padre_externo: Optional[str] = None
    madre_externo: Optional[str] = None
    fecha: str
    objetivo: Optional[str] = None
    notas: Optional[str] = None
    estado: str = "planeado"

    criador_id: Optional[str] = None
    castador_id: Optional[str] = None

    cantidad_huevos_pollitos: Optional[int] = None
    cantidad_registrada: Optional[int] = None

    marca_nacimiento: Optional[str] = None
    marca_lado: Optional[str] = None
    marca_color: Optional[str] = None
    sin_marca: Optional[bool] = False
    marcas_nacimiento: Optional[List[str]] = []


class CruceCreate(CruceBase):
    pass


class CruceUpdate(BaseModel):
    padre_id: Optional[str] = None
    madre_id: Optional[str] = None
    padre_externo: Optional[str] = None
    madre_externo: Optional[str] = None
    fecha: Optional[str] = None
    objetivo: Optional[str] = None
    notas: Optional[str] = None
    estado: Optional[str] = None

    criador_id: Optional[str] = None
    castador_id: Optional[str] = None

    cantidad_huevos_pollitos: Optional[int] = None
    cantidad_registrada: Optional[int] = None

    marca_nacimiento: Optional[str] = None
    marca_lado: Optional[str] = None
    marca_color: Optional[str] = None
    sin_marca: Optional[bool] = None
    marcas_nacimiento: Optional[List[str]] = None


class CruceResponse(CruceBase):
    id: str
    user_id: str
    consanguinidad_estimado: Optional[float] = None
    created_at: datetime
    updated_at: datetime

# Camada Models
class CamadaBase(BaseModel):
    cruce_id: str
    fecha_puesta_inicio: Optional[str] = None
    cantidad_huevos: Optional[int] = None
    fecha_incubacion_inicio: Optional[str] = None
    metodo: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    pollitos_nacidos: Optional[int] = None
    criador_nombre: Optional[str] = None
    notas: Optional[str] = None

class CamadaCreate(CamadaBase):
    pass

class CamadaUpdate(BaseModel):
    cruce_id: Optional[str] = None
    fecha_puesta_inicio: Optional[str] = None
    cantidad_huevos: Optional[int] = None
    fecha_incubacion_inicio: Optional[str] = None
    metodo: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    pollitos_nacidos: Optional[int] = None
    criador_nombre: Optional[str] = None
    notas: Optional[str] = None

class CamadaResponse(CamadaBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

# Pelea Models
class PeleaBase(BaseModel):
    ave_id: str
    fecha: str
    lugar: Optional[str] = None
    ganadas: int = 0
    perdidas: int = 0
    entabladas: int = 0
    calificacion: str
    notas: Optional[str] = None

    @validator("ganadas", "perdidas", "entabladas")
    def validar_cantidades(cls, v):
        if v < 0:
            raise ValueError("Las cantidades no pueden ser negativas")
        return v

    @validator("entabladas", always=True)
    def validar_al_menos_un_resultado(cls, v, values):
        ganadas = values.get("ganadas", 0)
        perdidas = values.get("perdidas", 0)
        entabladas = v or 0

        if ganadas == 0 and perdidas == 0 and entabladas == 0:
            raise ValueError("Debes registrar al menos un resultado")
        return entabladas


class PeleaCreate(PeleaBase):
    pass

class PeleaUpdate(BaseModel):
    ave_id: Optional[str] = None
    fecha: Optional[str] = None
    lugar: Optional[str] = None
    ganadas: Optional[int] = None
    perdidas: Optional[int] = None
    entabladas: Optional[int] = None
    calificacion: Optional[str] = None
    notas: Optional[str] = None

    @validator("ganadas", "perdidas", "entabladas")
    def validar_cantidades_update(cls, v):
        if v is not None and v < 0:
            raise ValueError("Las cantidades no pueden ser negativas")
        return v


class PeleaResponse(PeleaBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

# Salud Models
class SaludBase(BaseModel):
    ave_id: str
    tipo: str
    producto: str
    dosis: Optional[str] = None
    fecha: str
    proxima_fecha: Optional[str] = None
    notas: Optional[str] = None

class SaludCreate(SaludBase):
    pass

class SaludUpdate(BaseModel):
    ave_id: Optional[str] = None
    tipo: Optional[str] = None
    producto: Optional[str] = None
    dosis: Optional[str] = None
    fecha: Optional[str] = None
    proxima_fecha: Optional[str] = None
    notas: Optional[str] = None

class SaludResponse(SaludBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

# Cuido Models
class TrabajoItem(BaseModel):
    numero: int
    tiempo_minutos: Optional[int] = None
    completado: bool = False
    fecha_completado: Optional[str] = None
    notas: Optional[str] = None

class CuidoBase(BaseModel):
    ave_id: str
    fecha_inicio: str
    estado: str = "activo"
    tope1_completado: bool = False
    tope1_fecha: Optional[str] = None
    tope1_notas: Optional[str] = None
    tope2_completado: bool = False
    tope2_fecha: Optional[str] = None
    tope2_notas: Optional[str] = None
    trabajos: List[TrabajoItem] = []
    en_descanso: bool = False
    dias_descanso: Optional[int] = None
    fecha_inicio_descanso: Optional[str] = None
    fecha_fin_descanso: Optional[str] = None
    notas: Optional[str] = None

class CuidoCreate(BaseModel):
    ave_id: str
    fecha_inicio: Optional[str] = None
    notas: Optional[str] = None

class CuidoUpdate(BaseModel):
    estado: Optional[str] = None
    tope1_completado: Optional[bool] = None
    tope1_fecha: Optional[str] = None
    tope1_notas: Optional[str] = None
    tope2_completado: Optional[bool] = None
    tope2_fecha: Optional[str] = None
    tope2_notas: Optional[str] = None
    trabajos: Optional[List[TrabajoItem]] = None
    en_descanso: Optional[bool] = None
    dias_descanso: Optional[int] = None
    fecha_inicio_descanso: Optional[str] = None
    fecha_fin_descanso: Optional[str] = None
    notas: Optional[str] = None

class CuidoResponse(CuidoBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

# Sync Models
class SyncData(BaseModel):
    aves: List[Dict[str, Any]] = []
    cruces: List[Dict[str, Any]] = []
    camadas: List[Dict[str, Any]] = []
    peleas: List[Dict[str, Any]] = []
    salud: List[Dict[str, Any]] = []
    last_sync: Optional[str] = None

# ============== HELPERS ==============

def hash_pin(pin: str) -> str:
    return bcrypt.hashpw(pin.encode(), bcrypt.gensalt()).decode()

def verify_pin(pin: str, hashed: str) -> bool:
    return bcrypt.checkpw(pin.encode(), hashed.encode())

def create_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="No autorizado")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token inválido")
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        return {"id": str(user["_id"]), **{k: v for k, v in user.items() if k != "_id" and k != "pin"}}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")

def serialize_doc(doc: dict) -> dict:
    if doc is None:
        return None

    now = datetime.utcnow()

    if "created_at" not in doc or doc.get("created_at") is None:
        doc["created_at"] = now
    if "updated_at" not in doc or doc.get("updated_at") is None:
        doc["updated_at"] = doc["created_at"]

    result = {}

    # 🔥 FIX IMPORTANTE
    if "_id" in doc:
        result["id"] = str(doc["_id"])
    else:
        result["id"] = str(doc.get("id", ""))

    for k, v in doc.items():
        if k != "_id":
            if isinstance(v, ObjectId):
                result[k] = str(v)
            else:
                result[k] = v

    return result

def normalize_pelea_doc(doc: dict) -> dict:
    if doc is None:
        return None

    doc = serialize_doc(doc)

    # Si ya viene en formato nuevo
    if "ganadas" in doc or "perdidas" in doc or "entabladas" in doc:
        doc["ganadas"] = int(doc.get("ganadas", 0) or 0)
        doc["perdidas"] = int(doc.get("perdidas", 0) or 0)
        doc["entabladas"] = int(doc.get("entabladas", 0) or 0)
        return doc

    # Compatibilidad con formato viejo
    resultado = doc.get("resultado")
    cantidad = int(doc.get("cantidad_resultado", 1) or 1)

    doc["ganadas"] = cantidad if resultado == "GANO" else 0
    doc["perdidas"] = cantidad if resultado == "PERDIO" else 0
    doc["entabladas"] = cantidad if resultado == "ENTABLO" else 0

    return doc


def parse_datetime_safe(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value)
        except Exception:
            return None
    return None


def clean_nullable_string(value):
    if value is None:
        return None
    if isinstance(value, str):
        cleaned = value.strip()
        if cleaned == "" or cleaned.lower() == "null":
            return None
        return cleaned
    return value


def is_premium_active_for_user(user_doc: dict) -> bool:
    if not user_doc:
        return False

    premium_expires_at = parse_datetime_safe(user_doc.get("premium_expires_at"))
    if not premium_expires_at:
        return False

    return premium_expires_at > datetime.utcnow()


def get_records_limit_for_user(user_doc: dict):
    if is_premium_active_for_user(user_doc):
        return None
    return 20


def get_effective_plan(user_doc: dict) -> str:
    return "premium" if is_premium_active_for_user(user_doc) else "gratis"


async def normalize_user_subscription_state(user_doc: dict):
    if not user_doc:
        return None

    effective_plan = get_effective_plan(user_doc)
    update_fields = {}
    changed = False

    if user_doc.get("plan") != effective_plan:
        update_fields["plan"] = effective_plan
        changed = True
        user_doc["plan"] = effective_plan

    if effective_plan == "gratis":
        # Si ya no es premium, limpia cualquier residuo
        if user_doc.get("premium_expires_at") is not None:
            update_fields["premium_expires_at"] = None
            changed = True
            user_doc["premium_expires_at"] = None

        for field in [
            "subscription_platform",
            "subscription_product_id",
            "subscription_last_transaction_id",
            "subscription_purchase_token",
        ]:
            current = clean_nullable_string(user_doc.get(field))
            if current is not None:
                update_fields[field] = None
                changed = True
            user_doc[field] = None
    else:
        # Si sigue premium, normaliza strings basura tipo "null"
        for field in [
            "subscription_platform",
            "subscription_product_id",
            "subscription_last_transaction_id",
            "subscription_purchase_token",
        ]:
            user_doc[field] = clean_nullable_string(user_doc.get(field))

    if changed:
        update_fields["updated_at"] = datetime.utcnow()
        await db.users.update_one(
            {"_id": user_doc["_id"]},
            {"$set": update_fields}
        )

    return user_doc


def build_user_response(user_doc: dict) -> UserResponse:
    return UserResponse(
        id=str(user_doc["_id"]),
        telefono=user_doc["telefono"],
        email=user_doc.get("email"),
        nombre=user_doc.get("nombre"),
        created_at=user_doc["created_at"],
        plan=get_effective_plan(user_doc),
        records_used=int(user_doc.get("records_used", 0) or 0),
        premium_expires_at=parse_datetime_safe(user_doc.get("premium_expires_at")),
        premium_active=is_premium_active_for_user(user_doc),
        records_limit=get_records_limit_for_user(user_doc),
    )


async def ensure_user_can_create_records(user_id: str, amount: int = 1):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if is_premium_active_for_user(user):
        return

    records_used = int(user.get("records_used", 0) or 0)
    free_limit = 20

    if records_used + amount > free_limit:
        raise HTTPException(
            status_code=403,
            detail={
                "code": "FREE_PLAN_LIMIT_REACHED",
                "title": "Límite alcanzado",
                "message": "Has alcanzado el límite del plan gratis. Hazte Premium para seguir registrando."
            }
        )


async def increment_user_records_used(user_id: str, amount: int = 1):
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$inc": {"records_used": amount},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )


def _apple_config_ready() -> bool:
    return bool(
        APPLE_ISSUER_ID and
        APPLE_KEY_ID and
        APPLE_BUNDLE_ID and
        APPLE_PRIVATE_KEY_PATH and
        Path(APPLE_PRIVATE_KEY_PATH).exists()
    )


def generate_apple_api_token() -> str:
    if not _apple_config_ready():
        raise HTTPException(
            status_code=500,
            detail="Configuración Apple incompleta en el backend"
        )

    with open(APPLE_PRIVATE_KEY_PATH, "r", encoding="utf-8") as f:
        private_key = f.read()

    now = int(time.time())
    headers = {
        "alg": "ES256",
        "kid": APPLE_KEY_ID,
        "typ": "JWT",
    }
    payload = {
        "iss": APPLE_ISSUER_ID,
        "iat": now,
        "exp": now + 1200,
        "aud": "appstoreconnect-v1",
    }

    return jwt.encode(payload, private_key, algorithm="ES256", headers=headers)


def parse_apple_timestamp_ms(value) -> Optional[datetime]:
    if value in (None, ""):
        return None
    try:
        return datetime.utcfromtimestamp(int(value) / 1000)
    except Exception:
        return None


def extract_apple_transaction_payload(raw: dict) -> dict:
    if not raw:
        return {}

    signed_info = raw.get("signedTransactionInfo")
    if signed_info:
        try:
            payload = jwt.decode(
                signed_info,
                options={"verify_signature": False, "verify_exp": False, "verify_aud": False},
                algorithms=["ES256", "HS256", "RS256"],
            )
            if isinstance(payload, dict):
                return payload
        except Exception:
            pass

    return raw


def verify_apple_transaction_live(transaction_id: str) -> dict:
    if not transaction_id:
        raise HTTPException(status_code=400, detail="transaction_id requerido")

    token = generate_apple_api_token()
    url = f"https://api.storekit.itunes.apple.com/inApps/v1/transactions/{transaction_id}"

    try:
        response = requests.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=25,
        )
    except requests.RequestException as e:
        logger.exception("Error conectando con Apple")
        raise HTTPException(
            status_code=502,
            detail=f"No se pudo validar la compra con Apple: {str(e)}"
        )

    if response.status_code == 404:
        raise HTTPException(status_code=400, detail="Transacción de Apple no encontrada")

    if response.status_code >= 400:
        try:
            error_payload = response.json()
        except Exception:
            error_payload = response.text
        raise HTTPException(
            status_code=400,
            detail=f"Apple rechazó la validación: {error_payload}"
        )

    try:
        raw_data = response.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Respuesta inválida de Apple")

    tx = extract_apple_transaction_payload(raw_data)
    product_id = tx.get("productId")
    bundle_id = tx.get("bundleId")
    expires_at = parse_apple_timestamp_ms(tx.get("expiresDate"))

    if not product_id:
        raise HTTPException(status_code=400, detail="Apple no devolvió productId")

    if bundle_id and APPLE_BUNDLE_ID and bundle_id != APPLE_BUNDLE_ID:
        raise HTTPException(status_code=400, detail="La compra no pertenece a esta app")

    return {
        "product_id": product_id,
        "bundle_id": bundle_id,
        "expires_at": expires_at,
        "raw": tx,
    }


# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"telefono": user_data.telefono})
    if existing:
        raise HTTPException(status_code=400, detail="Este número ya está registrado")
    
    if not user_data.pin.isdigit() or len(user_data.pin) < 4 or len(user_data.pin) > 6:
        raise HTTPException(status_code=400, detail="El PIN debe ser de 4 a 6 dígitos")
    
    user_doc = {
        "telefono": user_data.telefono,
        "email": user_data.email,
        "nombre": user_data.nombre,
        "pin": hash_pin(user_data.pin),
        "plan": "gratis",
        "records_used": 0,
        "premium_expires_at": None,
        "premium_started_at": None,
        "subscription_platform": None,
        "subscription_product_id": None,
        "subscription_last_transaction_id": None,
        "subscription_purchase_token": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    token = create_token(user_id)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            telefono=user_data.telefono,
            email=user_data.email,
            nombre=user_data.nombre,
            created_at=user_doc["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"telefono": credentials.telefono})
    if not user:
        raise HTTPException(status_code=401, detail="Número no registrado")
    
    if not verify_pin(credentials.pin, user["pin"]):
        raise HTTPException(status_code=401, detail="PIN incorrecto")
    
    user_id = str(user["_id"])
    token = create_token(user_id)
    
    return TokenResponse(
        access_token=token,
        user=build_user_response(user)
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user = await normalize_user_subscription_state(user)
    return build_user_response(user)

@api_router.get("/auth/subscription-status")
async def get_subscription_status(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user = await normalize_user_subscription_state(user)
    premium_active = is_premium_active_for_user(user)
    effective_plan = get_effective_plan(user)

    return {
        "plan": effective_plan,
        "records_used": int(user.get("records_used", 0) or 0),
        "premium_expires_at": parse_datetime_safe(user.get("premium_expires_at")),
        "premium_active": premium_active,
        "records_limit": get_records_limit_for_user(user),
        "premium_started_at": parse_datetime_safe(user.get("premium_started_at")),
        "subscription_platform": clean_nullable_string(user.get("subscription_platform")),
        "subscription_product_id": clean_nullable_string(user.get("subscription_product_id")),
        "subscription_last_transaction_id": clean_nullable_string(user.get("subscription_last_transaction_id")),
    }

class ProfileUpdate(BaseModel):
    email: Optional[str] = None
    nombre: Optional[str] = None

@api_router.put("/auth/profile")
async def update_profile(
    data: ProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    update_data = {"updated_at": datetime.utcnow()}
    if data.email is not None:
        update_data["email"] = data.email
    if data.nombre is not None:
        update_data["nombre"] = data.nombre
    
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": update_data}
    )
    
    updated_user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    return {
        "message": "Perfil actualizado",
        "user": build_user_response(updated_user)
    }

class ChangePinRequest(BaseModel):
    current_pin: str
    new_pin: str

@api_router.put("/auth/change-pin")
async def change_pin(
    data: ChangePinRequest,
    current_user: dict = Depends(get_current_user)
):
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if not verify_pin(data.current_pin, user["pin"]):
        raise HTTPException(status_code=400, detail="PIN actual incorrecto")
    
    if not data.new_pin.isdigit() or len(data.new_pin) < 4 or len(data.new_pin) > 6:
        raise HTTPException(status_code=400, detail="El nuevo PIN debe ser de 4 a 6 dígitos")
    
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {"pin": hash_pin(data.new_pin), "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "PIN actualizado correctamente"}

class ActivatePremiumRequest(BaseModel):
    plan_type: str  # mensual | anual
    platform: Optional[str] = None
    product_id: Optional[str] = None
    transaction_id: Optional[str] = None
    purchase_token: Optional[str] = None
    restore: bool = False


class RestorePremiumRequest(BaseModel):
    plan_type: str  # mensual | anual
    platform: Optional[str] = None
    product_id: Optional[str] = None
    transaction_id: Optional[str] = None
    purchase_token: Optional[str] = None


@api_router.post("/auth/activate-premium")
async def activate_premium(
    data: ActivatePremiumRequest,
    current_user: dict = Depends(get_current_user)
):
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    plan_type = (data.plan_type or "").strip().lower()
    if plan_type not in ["mensual", "anual"]:
        raise HTTPException(status_code=400, detail="plan_type debe ser mensual o anual")

    platform = (data.platform or "ios").strip().lower()

    now = datetime.utcnow()
    current_exp = parse_datetime_safe(user.get("premium_expires_at"))
    premium_active = bool(current_exp and current_exp > now)

    if platform == "ios":
        if not data.transaction_id:
            raise HTTPException(status_code=400, detail="transaction_id requerido para iOS")

        apple_result = verify_apple_transaction_live(data.transaction_id)
        product_id = apple_result["product_id"]
        expires_at = apple_result["expires_at"]

        allowed_products = {
            "com.migalleria.app.premium.mensual": "mensual",
            "com.migalleria.app.premium.anual": "anual",
        }

        if product_id not in allowed_products:
            raise HTTPException(status_code=400, detail="Producto de Apple no válido para premium")

        detected_plan = allowed_products[product_id]
        if detected_plan != plan_type:
            plan_type = detected_plan

        if expires_at and expires_at > now:
            new_exp = expires_at
            premium_started_at = user.get("premium_started_at") or now
        else:
            base_date = current_exp if premium_active else now
            new_exp = base_date + (timedelta(days=365) if plan_type == "anual" else timedelta(days=30))
            premium_started_at = user.get("premium_started_at") or now

        update_fields = {
            "plan": "premium",
            "premium_expires_at": new_exp,
            "premium_started_at": premium_started_at,
            "updated_at": now,
            "subscription_platform": "ios",
            "subscription_product_id": product_id,
            "subscription_last_transaction_id": data.transaction_id,
            "subscription_purchase_token": data.purchase_token,
        }
    else:
        # Fallback temporal para otras plataformas
        base_date = current_exp if premium_active else now
        new_exp = base_date + (timedelta(days=365) if plan_type == "anual" else timedelta(days=30))

        update_fields = {
            "plan": "premium",
            "premium_expires_at": new_exp,
            "updated_at": now,
            "premium_started_at": user.get("premium_started_at") or now,
        }

        if data.platform:
            update_fields["subscription_platform"] = data.platform
        if data.product_id:
            update_fields["subscription_product_id"] = data.product_id
        if data.transaction_id:
            update_fields["subscription_last_transaction_id"] = data.transaction_id
        if data.purchase_token:
            update_fields["subscription_purchase_token"] = data.purchase_token

    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": update_fields}
    )

    updated_user = await db.users.find_one({"_id": ObjectId(current_user["id"])})

    return {
        "message": "Premium activado correctamente" if not data.restore else "Premium restaurado correctamente",
        "user": build_user_response(updated_user)
    }


@api_router.post("/auth/restore-premium")
async def restore_premium(
    data: RestorePremiumRequest,
    current_user: dict = Depends(get_current_user)
):
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    plan_type = (data.plan_type or "").strip().lower()
    if plan_type not in ["mensual", "anual"]:
        raise HTTPException(status_code=400, detail="plan_type debe ser mensual o anual")

    platform = (data.platform or "ios").strip().lower()
    now = datetime.utcnow()
    current_exp = parse_datetime_safe(user.get("premium_expires_at"))
    premium_active = bool(current_exp and current_exp > now)

    if platform == "ios":
        if not data.transaction_id:
            raise HTTPException(status_code=400, detail="transaction_id requerido para iOS")

        apple_result = verify_apple_transaction_live(data.transaction_id)
        product_id = apple_result["product_id"]
        expires_at = apple_result["expires_at"]

        allowed_products = {
            "com.migalleria.app.premium.mensual": "mensual",
            "com.migalleria.app.premium.anual": "anual",
        }

        if product_id not in allowed_products:
            raise HTTPException(status_code=400, detail="Producto de Apple no válido para premium")

        detected_plan = allowed_products[product_id]
        if detected_plan != plan_type:
            plan_type = detected_plan

        if expires_at and expires_at > now:
            new_exp = expires_at
            premium_started_at = user.get("premium_started_at") or now
        else:
            base_date = current_exp if premium_active else now
            new_exp = base_date + (timedelta(days=365) if plan_type == "anual" else timedelta(days=30))
            premium_started_at = user.get("premium_started_at") or now

        update_fields = {
            "plan": "premium",
            "premium_expires_at": new_exp,
            "updated_at": now,
            "premium_started_at": premium_started_at,
            "subscription_platform": "ios",
            "subscription_product_id": product_id,
            "subscription_last_transaction_id": data.transaction_id,
            "subscription_purchase_token": data.purchase_token,
        }
    else:
        base_date = current_exp if premium_active else now
        new_exp = base_date + (timedelta(days=365) if plan_type == "anual" else timedelta(days=30))

        update_fields = {
            "plan": "premium",
            "premium_expires_at": new_exp,
            "updated_at": now,
            "premium_started_at": user.get("premium_started_at") or now,
        }

        if data.platform:
            update_fields["subscription_platform"] = data.platform
        if data.product_id:
            update_fields["subscription_product_id"] = data.product_id
        if data.transaction_id:
            update_fields["subscription_last_transaction_id"] = data.transaction_id
        if data.purchase_token:
            update_fields["subscription_purchase_token"] = data.purchase_token

    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": update_fields}
    )

    updated_user = await db.users.find_one({"_id": ObjectId(current_user["id"])})

    return {
        "message": "Premium restaurado correctamente",
        "user": build_user_response(updated_user)
    }

@api_router.delete("/auth/delete-account")
async def delete_account(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    # Eliminar todos los datos asociados al usuario
    await db.aves.delete_many({"user_id": user_id})
    await db.cruces.delete_many({"user_id": user_id})
    await db.camadas.delete_many({"user_id": user_id})
    await db.peleas.delete_many({"user_id": user_id})
    await db.salud.delete_many({"user_id": user_id})
    await db.cuido.delete_many({"user_id": user_id})

    # Eliminar usuario
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return {"message": "Cuenta eliminada correctamente"}

@api_router.get("/export/data")
async def export_data(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    aves_count = await db.aves.count_documents({"user_id": user_id})
    cruces_count = await db.cruces.count_documents({"user_id": user_id})
    camadas_count = await db.camadas.count_documents({"user_id": user_id})
    peleas_count = await db.peleas.count_documents({"user_id": user_id})
    
    return {
        "aves": aves_count,
        "cruces": cruces_count,
        "camadas": camadas_count,
        "peleas": peleas_count
    }

# ============== AVES ROUTES ==============

@api_router.post("/aves", response_model=AveResponse)
async def create_ave(ave: AveCreate, current_user: dict = Depends(get_current_user)):
    await ensure_user_can_create_records(current_user["id"], 1)
    if ave.padre_id:
        padre = await db.aves.find_one({"_id": ObjectId(ave.padre_id), "user_id": current_user["id"]})
        if padre and padre.get("tipo") != "gallo":
            raise HTTPException(status_code=400, detail="El padre debe ser un gallo")
    
    if ave.madre_id:
        madre = await db.aves.find_one({"_id": ObjectId(ave.madre_id), "user_id": current_user["id"]})
        if madre and madre.get("tipo") != "gallina":
            raise HTTPException(status_code=400, detail="La madre debe ser una gallina")
    
    ave_doc = {
        **ave.dict(),
        "user_id": current_user["id"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.aves.insert_one(ave_doc)
    ave_doc["_id"] = result.inserted_id
    
    await increment_user_records_used(current_user["id"], 1)
    
    return AveResponse(**serialize_doc(ave_doc))

@api_router.get("/aves/migrar-imagenes-publico")
async def migrar_imagenes_publico():
    import cloudinary.uploader

    cursor = db.aves.find({
        "foto_principal": {"$regex": "^data:image"}
    }).limit(20)  # 👈 SOLO 20 POR VEZ

    migradas = 0

    async for ave in cursor:
        try:
            result = cloudinary.uploader.upload(ave["foto_principal"])
            nueva_url = result.get("secure_url")

            await db.aves.update_one(
                {"_id": ave["_id"]},
                {"$set": {"foto_principal": nueva_url}}
            )

            migradas += 1

        except Exception as e:
            print("Error migrando:", e)

    return {"mensaje": f"{migradas} imágenes migradas (batch)"}

@api_router.get("/aves", response_model=List[AveResponse])
async def get_aves(
    tipo: Optional[str] = None,
    estado: Optional[str] = None,
    color: Optional[str] = None,
    linea: Optional[str] = None,
    limit: int = 1000,
    current_user: dict = Depends(get_current_user)
):
    import time
    start_time = time.time()
    print("INICIO /aves")

    query = {"user_id": current_user["id"]}

    if tipo and tipo != "todos":
        query["tipo"] = tipo

    # Temporalmente ignoramos estado para no ocultar aves existentes
    # a usuarios con la app vieja que todavía abre filtrando por "activo".
    if color:
        query["color"] = {"$regex": color, "$options": "i"}
    if linea:
        query["linea"] = {"$regex": linea, "$options": "i"}

    if limit < 1:
        limit = 1
    if limit > 1000:
        limit = 1000

    aves = await db.aves.find(query).sort("created_at", -1).limit(limit).to_list(length=limit)

    normalized = []
    now = datetime.utcnow()

    for ave in aves:
        if "created_at" not in ave or ave.get("created_at") is None:
            ave["created_at"] = now
        if "updated_at" not in ave or ave.get("updated_at") is None:
            ave["updated_at"] = ave["created_at"]

        normalized.append(AveResponse(**serialize_doc(ave)))

    print(f"FIN /aves: {(time.time() - start_time):.2f} segundos")
    return normalized

@api_router.get("/aves/{ave_id}", response_model=AveResponse)
async def get_ave(ave_id: str, current_user: dict = Depends(get_current_user)):
    ave = await db.aves.find_one({"_id": ObjectId(ave_id), "user_id": current_user["id"]})
    if not ave:
        raise HTTPException(status_code=404, detail="Ave no encontrada")
    return AveResponse(**serialize_doc(ave))

@api_router.put("/aves/{ave_id}", response_model=AveResponse)
async def update_ave(ave_id: str, ave_update: AveUpdate, current_user: dict = Depends(get_current_user)):
    existing = await db.aves.find_one({"_id": ObjectId(ave_id), "user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Ave no encontrada")
    
    update_data = {k: v for k, v in ave_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    if "padre_id" in update_data and update_data["padre_id"]:
        padre = await db.aves.find_one({"_id": ObjectId(update_data["padre_id"]), "user_id": current_user["id"]})
        if padre and padre.get("tipo") != "gallo":
            raise HTTPException(status_code=400, detail="El padre debe ser un gallo")
    
    if "madre_id" in update_data and update_data["madre_id"]:
        madre = await db.aves.find_one({"_id": ObjectId(update_data["madre_id"]), "user_id": current_user["id"]})
        if madre and madre.get("tipo") != "gallina":
            raise HTTPException(status_code=400, detail="La madre debe ser una gallina")
    
    await db.aves.update_one({"_id": ObjectId(ave_id)}, {"$set": update_data})
    
    updated = await db.aves.find_one({"_id": ObjectId(ave_id)})
    return AveResponse(**serialize_doc(updated))

@api_router.delete("/aves/{ave_id}")
async def delete_ave(ave_id: str, current_user: dict = Depends(get_current_user)):
    children = await db.aves.count_documents({
        "user_id": current_user["id"],
        "$or": [{"padre_id": ave_id}, {"madre_id": ave_id}]
    })
    
    cruces = await db.cruces.count_documents({
        "user_id": current_user["id"],
        "$or": [{"padre_id": ave_id}, {"madre_id": ave_id}]
    })
    
    result = await db.aves.delete_one({"_id": ObjectId(ave_id), "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ave no encontrada")
    
    await db.peleas.delete_many({"ave_id": ave_id, "user_id": current_user["id"]})
    await db.salud.delete_many({"ave_id": ave_id, "user_id": current_user["id"]})
    
    return {
        "message": "Ave eliminada",
        "warning": f"Esta ave era padre/madre de {children} aves y estaba en {cruces} cruces" if children > 0 or cruces > 0 else None
    }

# ============== PEDIGRI ROUTES ==============

@api_router.get("/aves/{ave_id}/pedigri")
async def get_pedigri(ave_id: str, generations: int = 5, current_user: dict = Depends(get_current_user)):
    async def get_ancestors(bird_id: str, gen: int, externo_info: dict = None) -> dict:
        if gen > generations:
            return None
        
        if externo_info:
            return {
                "id": None,
                "codigo": externo_info.get("codigo"),
                "nombre": externo_info.get("nombre"),
                "tipo": externo_info.get("tipo", "gallo"),
                "galleria": externo_info.get("galleria"),
                "externo": True,
                "generation": gen
            }
        
        if not bird_id:
            return None
        
        bird = await db.aves.find_one({"_id": ObjectId(bird_id), "user_id": current_user["id"]})
        if not bird:
            return {"id": bird_id, "unknown": True}
        
        result = {
            "id": str(bird["_id"]),
            "codigo": bird.get("codigo"),
            "nombre": bird.get("nombre"),
            "tipo": bird.get("tipo"),
            "color": bird.get("color"),
            "linea": bird.get("linea"),
            "galleria": bird.get("galleria"),
            "foto_principal": bird.get("foto_principal"),
            "generation": gen
        }
        
        if gen < generations:
            if bird.get("padre_id"):
                result["padre"] = await get_ancestors(bird.get("padre_id"), gen + 1)
            elif bird.get("padre_externo"):
                padre_ext = await get_ancestors(None, gen + 1, {
                    "codigo": bird.get("padre_externo"),
                    "tipo": "gallo",
                    "galleria": bird.get("padre_galleria")
                })
                if gen + 1 < generations:
                    if bird.get("abuelo_paterno_padre"):
                        padre_ext["padre"] = {
                            "codigo": bird.get("abuelo_paterno_padre"),
                            "galleria": bird.get("abuelo_paterno_padre_galleria"),
                            "tipo": "gallo",
                            "externo": True,
                            "generation": gen + 2
                        }
                    if bird.get("abuelo_paterno_madre"):
                        padre_ext["madre"] = {
                            "codigo": bird.get("abuelo_paterno_madre"),
                            "galleria": bird.get("abuelo_paterno_madre_galleria"),
                            "tipo": "gallina",
                            "externo": True,
                            "generation": gen + 2
                        }
                result["padre"] = padre_ext
            
            if bird.get("madre_id"):
                result["madre"] = await get_ancestors(bird.get("madre_id"), gen + 1)
            elif bird.get("madre_externo"):
                madre_ext = await get_ancestors(None, gen + 1, {
                    "codigo": bird.get("madre_externo"),
                    "tipo": "gallina",
                    "galleria": bird.get("madre_galleria")
                })
                if gen + 1 < generations:
                    if bird.get("abuelo_materno_padre"):
                        madre_ext["padre"] = {
                            "codigo": bird.get("abuelo_materno_padre"),
                            "galleria": bird.get("abuelo_materno_padre_galleria"),
                            "tipo": "gallo",
                            "externo": True,
                            "generation": gen + 2
                        }
                    if bird.get("abuelo_materno_madre"):
                        madre_ext["madre"] = {
                            "codigo": bird.get("abuelo_materno_madre"),
                            "galleria": bird.get("abuelo_materno_madre_galleria"),
                            "tipo": "gallina",
                            "externo": True,
                            "generation": gen + 2
                        }
                result["madre"] = madre_ext
        
        return result
    
    ave = await db.aves.find_one({"_id": ObjectId(ave_id), "user_id": current_user["id"]})
    if not ave:
        raise HTTPException(status_code=404, detail="Ave no encontrada")
    
    pedigri = await get_ancestors(ave_id, 1)
    return pedigri

@api_router.get("/aves/{ave_id}/hijos", response_model=List[AveResponse])
async def get_hijos(ave_id: str, current_user: dict = Depends(get_current_user)):
    ave = await db.aves.find_one({"_id": ObjectId(ave_id), "user_id": current_user["id"]})
    if not ave:
        raise HTTPException(status_code=404, detail="Ave no encontrada")
    
    query = {"user_id": current_user["id"]}
    if ave.get("tipo") == "gallo":
        query["padre_id"] = ave_id
    else:
        query["madre_id"] = ave_id
    
    hijos = await db.aves.find(query).to_list(1000)
    return [AveResponse(**serialize_doc(h)) for h in hijos]

# ============== CONSANGUINIDAD ==============

@api_router.get("/consanguinidad")
async def calculate_consanguinidad(
    padre_id: str,
    madre_id: str,
    current_user: dict = Depends(get_current_user)
):
    async def get_all_ancestors(bird_id: str, gen: int, max_gen: int = 5) -> List[tuple]:
        if gen > max_gen or not bird_id:
            return []
        
        ancestors = [(bird_id, gen)]
        bird = await db.aves.find_one({"_id": ObjectId(bird_id), "user_id": current_user["id"]})
        if bird:
            if bird.get("padre_id"):
                ancestors.extend(await get_all_ancestors(bird.get("padre_id"), gen + 1, max_gen))
            if bird.get("madre_id"):
                ancestors.extend(await get_all_ancestors(bird.get("madre_id"), gen + 1, max_gen))
        
        return ancestors
    
    padre_ancestors = await get_all_ancestors(padre_id, 1)
    madre_ancestors = await get_all_ancestors(madre_id, 1)
    
    padre_ids = {a[0]: a[1] for a in padre_ancestors}
    madre_ids = {a[0]: a[1] for a in madre_ancestors}
    
    common = []
    for aid, gen in padre_ids.items():
        if aid in madre_ids:
            min_gen = min(gen, madre_ids[aid])
            ave = await db.aves.find_one({"_id": ObjectId(aid)})
            if ave:
                common.append({
                    "id": aid,
                    "codigo": ave.get("codigo"),
                    "nombre": ave.get("nombre"),
                    "generation_padre": gen,
                    "generation_madre": madre_ids[aid],
                    "closest_generation": min_gen
                })
    
    if not common:
        percentage = 0
        level = "bajo"
    else:
        min_gen = min(c["closest_generation"] for c in common)
        if min_gen <= 1:
            percentage = 50
            level = "alto"
        elif min_gen <= 2:
            percentage = 25
            level = "alto"
        elif min_gen <= 3:
            percentage = 12.5
            level = "medio"
        elif min_gen <= 4:
            percentage = 6.25
            level = "medio"
        else:
            percentage = 3.125
            level = "bajo"
    
    return {
        "porcentaje_estimado": percentage,
        "nivel": level,
        "ancestros_comunes": common,
        "total_comunes": len(common)
    }

# ============== CRIADORES / CASTADORES ROUTES ==============

@api_router.get("/criadores")
async def get_criadores(current_user: dict = Depends(get_current_user)):
    results = []

    if current_user.get("nombre"):
        results.append({
            "id": current_user["id"],
            "nombre": current_user["nombre"]
        })

    aves = await db.aves.find(
        {
            "user_id": current_user["id"],
            "castado_por": {"$exists": True, "$ne": None, "$ne": ""}
        }
    ).to_list(1000)

    seen_names = set()
    for r in results:
        if r.get("nombre"):
            seen_names.add(r["nombre"].strip().lower())

    for ave in aves:
        nombre = (ave.get("castado_por") or "").strip()
        if nombre and nombre.lower() not in seen_names:
            results.append({
                "id": f"castador_{nombre.lower().replace(' ', '_')}",
                "nombre": nombre
            })
            seen_names.add(nombre.lower())

    return results

@api_router.get("/castadores")
async def get_castadores(current_user: dict = Depends(get_current_user)):
    return await get_criadores(current_user)

# ============== CRUCES ROUTES ==============

def normalize_marcas_payload(data: dict, existing: Optional[dict] = None) -> dict:
    marcas = data.get("marcas_nacimiento")

    if data.get("sin_marca") is True:
        data["marcas_nacimiento"] = []
        data["marca_nacimiento"] = None
        data["marca_lado"] = None
        data["marca_color"] = None
        return data

    if marcas is None:
        if existing and "marcas_nacimiento" in existing:
            marcas = existing.get("marcas_nacimiento") or []
        else:
            marcas = []

    marcas = [str(m).strip() for m in marcas if str(m).strip()]
    data["marcas_nacimiento"] = marcas

    if not marcas:
        data["marca_nacimiento"] = None
        data["marca_lado"] = None
        data["marca_color"] = None
        return data

    first_mark = marcas[0]

    if first_mark == "marca_casera":
        data["marca_nacimiento"] = "marca_casera"
        data["marca_lado"] = None
        if not data.get("marca_color") and existing:
            data["marca_color"] = existing.get("marca_color")
        return data

    parts = first_mark.split("_")
    if len(parts) >= 3:
        data["marca_nacimiento"] = f"{parts[0]}_{parts[1]}"
        data["marca_lado"] = parts[2]

    return data


@api_router.post("/cruces", response_model=CruceResponse)
async def create_cruce(cruce: CruceCreate, current_user: dict = Depends(get_current_user)):
    await ensure_user_can_create_records(current_user["id"], 1)
    if cruce.padre_id:
        padre = await db.aves.find_one({
            "_id": ObjectId(cruce.padre_id),
            "user_id": current_user["id"]
        })
        if not padre:
            raise HTTPException(status_code=404, detail="Padre no encontrado")
        if padre.get("tipo") != "gallo":
            raise HTTPException(status_code=400, detail="El padre debe ser un gallo")
    elif not cruce.padre_externo:
        raise HTTPException(status_code=400, detail="Debes seleccionar o agregar un padre")

    if cruce.madre_id:
        madre = await db.aves.find_one({
            "_id": ObjectId(cruce.madre_id),
            "user_id": current_user["id"]
        })
        if not madre:
            raise HTTPException(status_code=404, detail="Madre no encontrada")
        if madre.get("tipo") != "gallina":
            raise HTTPException(status_code=400, detail="La madre debe ser una gallina")
    elif not cruce.madre_externo:
        raise HTTPException(status_code=400, detail="Debes seleccionar o agregar una madre")

    consanguinidad_estimado = 0.0
    if cruce.padre_id and cruce.madre_id:
        consang_result = await calculate_consanguinidad(
            cruce.padre_id,
            cruce.madre_id,
            current_user
        )
        consanguinidad_estimado = consang_result["porcentaje_estimado"]

    cruce_data = cruce.dict()
    cruce_data = normalize_marcas_payload(cruce_data)

    cruce_doc = {
        **cruce_data,
        "user_id": current_user["id"],
        "consanguinidad_estimado": consanguinidad_estimado,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await db.cruces.insert_one(cruce_doc)
    created = await db.cruces.find_one({"_id": result.inserted_id})

    await increment_user_records_used(current_user["id"], 1)

    return CruceResponse(**serialize_doc(created))


@api_router.get("/cruces", response_model=List[CruceResponse])
async def get_cruces(
    estado: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"user_id": current_user["id"]}

    # Mostrar todo por defecto. Solo filtra si realmente se envía un estado válido.
    if estado and estado not in ["todos", "all"]:
        query["estado"] = estado

    cruces = await db.cruces.find(query).sort("created_at", -1).to_list(1000)
    return [CruceResponse(**serialize_doc(c)) for c in cruces]


@api_router.get("/cruces/{cruce_id}", response_model=CruceResponse)
async def get_cruce(cruce_id: str, current_user: dict = Depends(get_current_user)):
    cruce = await db.cruces.find_one({
        "_id": ObjectId(cruce_id),
        "user_id": current_user["id"]
    })
    if not cruce:
        raise HTTPException(status_code=404, detail="Cruce no encontrado")
    return CruceResponse(**serialize_doc(cruce))


@api_router.put("/cruces/{cruce_id}", response_model=CruceResponse)
async def update_cruce(
    cruce_id: str,
    cruce_update: CruceUpdate,
    current_user: dict = Depends(get_current_user)
):
    existing = await db.cruces.find_one({
        "_id": ObjectId(cruce_id),
        "user_id": current_user["id"]
    })
    if not existing:
        raise HTTPException(status_code=404, detail="Cruce no encontrado")

    update_data = cruce_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()

    padre_id = update_data.get("padre_id", existing.get("padre_id"))
    madre_id = update_data.get("madre_id", existing.get("madre_id"))

    if padre_id:
        padre = await db.aves.find_one({
            "_id": ObjectId(padre_id),
            "user_id": current_user["id"]
        })
        if not padre:
            raise HTTPException(status_code=404, detail="Padre no encontrado")
        if padre.get("tipo") != "gallo":
            raise HTTPException(status_code=400, detail="El padre debe ser un gallo")

    if madre_id:
        madre = await db.aves.find_one({
            "_id": ObjectId(madre_id),
            "user_id": current_user["id"]
        })
        if not madre:
            raise HTTPException(status_code=404, detail="Madre no encontrada")
        if madre.get("tipo") != "gallina":
            raise HTTPException(status_code=400, detail="La madre debe ser una gallina")

    if padre_id and madre_id:
        consang_result = await calculate_consanguinidad(
            padre_id,
            madre_id,
            current_user
        )
        update_data["consanguinidad_estimado"] = consang_result["porcentaje_estimado"]

    update_data = normalize_marcas_payload(update_data, existing=existing)

    await db.cruces.update_one(
        {"_id": ObjectId(cruce_id), "user_id": current_user["id"]},
        {"$set": update_data}
    )

    updated = await db.cruces.find_one({
        "_id": ObjectId(cruce_id),
        "user_id": current_user["id"]
    })
    return CruceResponse(**serialize_doc(updated))


@api_router.delete("/cruces/{cruce_id}")
async def delete_cruce(cruce_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.cruces.delete_one({
        "_id": ObjectId(cruce_id),
        "user_id": current_user["id"]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cruce no encontrado")
    return {"message": "Cruce eliminado"}
# ============== CAMADAS ROUTES ==============

@api_router.post("/camadas", response_model=CamadaResponse)
async def create_camada(camada: CamadaCreate, current_user: dict = Depends(get_current_user)):
    await ensure_user_can_create_records(current_user["id"], 1)
    cruce = await db.cruces.find_one({"_id": ObjectId(camada.cruce_id), "user_id": current_user["id"]})
    if not cruce:
        raise HTTPException(status_code=404, detail="Cruce no encontrado")
    
    camada_doc = {
        **camada.dict(),
        "user_id": current_user["id"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.camadas.insert_one(camada_doc)
    camada_doc["_id"] = result.inserted_id
    
    await db.cruces.update_one({"_id": ObjectId(camada.cruce_id)}, {"$set": {"estado": "hecho"}})
    await increment_user_records_used(current_user["id"], 1)
    
    return CamadaResponse(**serialize_doc(camada_doc))

@api_router.get("/camadas/{camada_id}")
async def get_camada(camada_id: str, current_user: dict = Depends(get_current_user)):
    camada = await db.camadas.find_one({
        "_id": ObjectId(camada_id),
        "user_id": current_user["id"]
    })
    if not camada:
        raise HTTPException(status_code=404, detail="Camada no encontrada")

    camada_data = serialize_doc(camada)

    cruce_data = None
    if camada_data.get("cruce_id"):
        cruce = await db.cruces.find_one({
            "_id": ObjectId(camada_data["cruce_id"]),
            "user_id": current_user["id"]
        })
        if cruce:
            cruce_data = serialize_doc(cruce)

    return {
        **camada_data,
        "cruce": cruce_data,
        "criador": camada_data.get("criador_nombre")
    }

@api_router.get("/camadas", response_model=List[CamadaResponse])
async def get_camadas(current_user: dict = Depends(get_current_user)):
    camadas = await db.camadas.find({
        "user_id": current_user["id"]
    }).sort("created_at", -1).to_list(1000)

    return [CamadaResponse(**serialize_doc(c)) for c in camadas]

@api_router.put("/camadas/{camada_id}", response_model=CamadaResponse)
async def update_camada(camada_id: str, camada_update: CamadaUpdate, current_user: dict = Depends(get_current_user)):
    existing = await db.camadas.find_one({"_id": ObjectId(camada_id), "user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Camada no encontrada")
    
    update_data = {k: v for k, v in camada_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.camadas.update_one({"_id": ObjectId(camada_id)}, {"$set": update_data})
    
    updated = await db.camadas.find_one({"_id": ObjectId(camada_id)})
    return CamadaResponse(**serialize_doc(updated))

@api_router.post("/camadas/{camada_id}/crear-pollitos")
async def crear_pollitos(
    camada_id: str,
    cantidad: int,
    current_user: dict = Depends(get_current_user)
):
    if cantidad < 1:
        raise HTTPException(status_code=400, detail="La cantidad debe ser mayor que 0")

    await ensure_user_can_create_records(current_user["id"], cantidad)
    camada = await db.camadas.find_one({"_id": ObjectId(camada_id), "user_id": current_user["id"]})
    if not camada:
        raise HTTPException(status_code=404, detail="Camada no encontrada")
    
    cruce = await db.cruces.find_one({"_id": ObjectId(camada["cruce_id"]), "user_id": current_user["id"]})
    if not cruce:
        raise HTTPException(status_code=404, detail="Cruce no encontrado")
    
    created_aves = []
    for i in range(cantidad):
        ave_doc = {
            "tipo": "gallo",
            "codigo": f"P-{camada_id[-4:]}-{i+1}",
            "nombre": None,
            "foto_principal": None,
            "fecha_nacimiento": camada.get("fecha_nacimiento"),
            "color": None,
            "linea": None,
            "estado": "activo",
            "notas": f"Nacido de camada {camada_id}",
            "padre_id": cruce.get("padre_id"),
            "madre_id": cruce.get("madre_id"),
            "marcaje_qr": None,
            "user_id": current_user["id"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = await db.aves.insert_one(ave_doc)
        ave_doc["_id"] = result.inserted_id
        created_aves.append(serialize_doc(ave_doc))
    
    await db.camadas.update_one(
        {"_id": ObjectId(camada_id)},
        {"$set": {"pollitos_nacidos": cantidad, "updated_at": datetime.utcnow()}}
    )
    
    await increment_user_records_used(current_user["id"], cantidad)
    
    return {
        "message": f"{cantidad} pollitos creados",
        "aves": created_aves
    }

@api_router.delete("/camadas/{camada_id}")
async def delete_camada(camada_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.camadas.delete_one({"_id": ObjectId(camada_id), "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Camada no encontrada")
    return {"message": "Camada eliminada"}

# ============== PELEAS ROUTES ==============

# ============== PELEAS ROUTES ==============

@api_router.post("/peleas", response_model=PeleaResponse)
async def create_pelea(pelea: PeleaCreate, current_user: dict = Depends(get_current_user)):
    await ensure_user_can_create_records(current_user["id"], 1)
    ave = await db.aves.find_one({"_id": ObjectId(pelea.ave_id), "user_id": current_user["id"]})
    if not ave:
        raise HTTPException(status_code=404, detail="Ave no encontrada")
    
    pelea_doc = {
        **pelea.dict(),
        "user_id": current_user["id"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.peleas.insert_one(pelea_doc)
    pelea_doc["_id"] = result.inserted_id
    
    await increment_user_records_used(current_user["id"], 1)
    
    return PeleaResponse(**normalize_pelea_doc(pelea_doc))


@api_router.get("/peleas", response_model=List[PeleaResponse])
async def get_peleas(
    ave_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"user_id": current_user["id"]}

    if ave_id:
        query["ave_id"] = ave_id

    peleas = await db.peleas.find(query).sort("fecha", -1).to_list(1000)
    return [PeleaResponse(**normalize_pelea_doc(serialize_doc(p))) for p in peleas]


@api_router.get("/peleas/estadisticas")
async def get_estadisticas_peleas(
    ave_id: Optional[str] = None,
    linea: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"user_id": current_user["id"]}

    if ave_id:
        query["ave_id"] = ave_id

    peleas_raw = await db.peleas.find(query).to_list(1000)
    peleas = [normalize_pelea_doc(p) for p in peleas_raw]

    if linea:
        aves_linea = await db.aves.find({
            "user_id": current_user["id"],
            "linea": {"$regex": linea, "$options": "i"}
        }).to_list(1000)

        ave_ids = [str(a["_id"]) for a in aves_linea]
        peleas = [p for p in peleas if p.get("ave_id") in ave_ids]

    total = sum(
        p.get("ganadas", 0) + p.get("perdidas", 0) + p.get("entabladas", 0)
        for p in peleas
    )

    ganadas = sum(p.get("ganadas", 0) for p in peleas)
    perdidas = sum(p.get("perdidas", 0) for p in peleas)
    entabladas = sum(p.get("entabladas", 0) for p in peleas)

    calificaciones = {
        "EXTRAORDINARIA": 0,
        "BUENA": 0,
        "REGULAR": 0,
        "MALA": 0
    }

    for p in peleas:
        cal = p.get("calificacion")
        if cal in calificaciones:
            calificaciones[cal] += 1

    sorted_peleas = sorted(peleas, key=lambda x: x.get("fecha", ""), reverse=True)

    racha_actual = 0
    racha_tipo = None

    if sorted_peleas:
        primera = sorted_peleas[0]

        if primera.get("ganadas", 0) > 0:
            racha_tipo = "GANO"
        elif primera.get("perdidas", 0) > 0:
            racha_tipo = "PERDIO"
        elif primera.get("entabladas", 0) > 0:
            racha_tipo = "ENTABLO"

        for p in sorted_peleas:
            if racha_tipo == "GANO" and p.get("ganadas", 0) > 0:
                racha_actual += 1
            elif racha_tipo == "PERDIO" and p.get("perdidas", 0) > 0:
                racha_actual += 1
            elif racha_tipo == "ENTABLO" and p.get("entabladas", 0) > 0:
                racha_actual += 1
            else:
                break

    return {
        "total": total,
        "ganadas": ganadas,
        "perdidas": perdidas,
        "entabladas": entabladas,
        "porcentaje_victorias": round((ganadas / total * 100) if total > 0 else 0, 1),
        "calificaciones": calificaciones,
        "racha_actual": racha_actual,
        "racha_tipo": racha_tipo
    }


@api_router.get("/peleas/estadisticas-padres")
async def get_estadisticas_padres(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    peleas_raw = await db.peleas.find({"user_id": user_id}).to_list(10000)
    if not peleas_raw:
        return {"padres": [], "madres": []}

    peleas = [normalize_pelea_doc(p) for p in peleas_raw]

    aves = await db.aves.find({"user_id": user_id}).to_list(10000)
    aves_map = {str(a["_id"]): a for a in aves}

    padre_stats = {}
    madre_stats = {}

    for pelea in peleas:
        ave_id = pelea.get("ave_id")
        ave = aves_map.get(ave_id)
        if not ave:
            continue

        ganadas = pelea.get("ganadas", 0)
        total = (
            pelea.get("ganadas", 0) +
            pelea.get("perdidas", 0) +
            pelea.get("entabladas", 0)
        )

        padre_id = ave.get("padre_id")
        if padre_id and padre_id in aves_map:
            padre = aves_map[padre_id]
            if padre_id not in padre_stats:
                padre_stats[padre_id] = {
                    "id": padre_id,
                    "codigo": padre.get("codigo"),
                    "nombre": padre.get("nombre"),
                    "ganadas": 0,
                    "total": 0,
                    "hijos_ids": set()
                }

            padre_stats[padre_id]["ganadas"] += ganadas
            padre_stats[padre_id]["total"] += total
            padre_stats[padre_id]["hijos_ids"].add(ave_id)

        madre_id = ave.get("madre_id")
        if madre_id and madre_id in aves_map:
            madre = aves_map[madre_id]
            if madre_id not in madre_stats:
                madre_stats[madre_id] = {
                    "id": madre_id,
                    "codigo": madre.get("codigo"),
                    "nombre": madre.get("nombre"),
                    "ganadas": 0,
                    "total": 0,
                    "hijos_ids": set()
                }

            madre_stats[madre_id]["ganadas"] += ganadas
            madre_stats[madre_id]["total"] += total
            madre_stats[madre_id]["hijos_ids"].add(ave_id)

    padres_list = []
    for pid, data in padre_stats.items():
        porcentaje = round((data["ganadas"] / data["total"] * 100) if data["total"] > 0 else 0, 1)
        padres_list.append({
            "id": data["id"],
            "codigo": data["codigo"],
            "nombre": data["nombre"],
            "ganadas": data["ganadas"],
            "total": data["total"],
            "porcentaje": porcentaje,
            "hijos_peleados": len(data["hijos_ids"])
        })

    madres_list = []
    for mid, data in madre_stats.items():
        porcentaje = round((data["ganadas"] / data["total"] * 100) if data["total"] > 0 else 0, 1)
        madres_list.append({
            "id": data["id"],
            "codigo": data["codigo"],
            "nombre": data["nombre"],
            "ganadas": data["ganadas"],
            "total": data["total"],
            "porcentaje": porcentaje,
            "hijos_peleados": len(data["hijos_ids"])
        })

    padres_list.sort(key=lambda x: (-x["porcentaje"], -x["total"]))
    madres_list.sort(key=lambda x: (-x["porcentaje"], -x["total"]))

    return {
        "padres": padres_list[:10],
        "madres": madres_list[:10]
    }


@api_router.get("/peleas/{pelea_id}", response_model=PeleaResponse)
async def get_pelea(pelea_id: str, current_user: dict = Depends(get_current_user)):
    pelea = await db.peleas.find_one({"_id": ObjectId(pelea_id), "user_id": current_user["id"]})
    if not pelea:
        raise HTTPException(status_code=404, detail="Pelea no encontrada")
    return PeleaResponse(**normalize_pelea_doc(pelea))


@api_router.put("/peleas/{pelea_id}", response_model=PeleaResponse)
async def update_pelea(pelea_id: str, pelea_update: PeleaUpdate, current_user: dict = Depends(get_current_user)):
    existing = await db.peleas.find_one({"_id": ObjectId(pelea_id), "user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Pelea no encontrada")
    
    update_data = {k: v for k, v in pelea_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.peleas.update_one({"_id": ObjectId(pelea_id)}, {"$set": update_data})
    
    updated = await db.peleas.find_one({"_id": ObjectId(pelea_id)})
    return PeleaResponse(**normalize_pelea_doc(updated))


@api_router.delete("/peleas/{pelea_id}")
async def delete_pelea(pelea_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.peleas.delete_one({
        "_id": ObjectId(pelea_id),
        "user_id": current_user["id"]
    })

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pelea no encontrada")

    return {"message": "Pelea eliminada"}

# ============== SALUD ROUTES ==============

@api_router.post("/salud", response_model=SaludResponse)
async def create_salud(salud: SaludCreate, current_user: dict = Depends(get_current_user)):
    await ensure_user_can_create_records(current_user["id"], 1)
    ave = await db.aves.find_one({"_id": ObjectId(salud.ave_id), "user_id": current_user["id"]})
    if not ave:
        raise HTTPException(status_code=404, detail="Ave no encontrada")
    
    salud_doc = {
        **salud.dict(),
        "user_id": current_user["id"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.salud.insert_one(salud_doc)
    salud_doc["_id"] = result.inserted_id
    
    await increment_user_records_used(current_user["id"], 1)
    
    return SaludResponse(**serialize_doc(salud_doc))

@api_router.get("/salud", response_model=List[SaludResponse])
async def get_salud_records(
    ave_id: Optional[str] = None,
    tipo: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"user_id": current_user["id"]}
    if ave_id:
        query["ave_id"] = ave_id
    if tipo:
        query["tipo"] = tipo
    
    records = await db.salud.find(query).sort("fecha", -1).to_list(1000)
    return [SaludResponse(**serialize_doc(r)) for r in records]

@api_router.get("/salud/recordatorios")
async def get_recordatorios(current_user: dict = Depends(get_current_user)):
    today = datetime.utcnow().strftime("%Y-%m-%d")
    week_later = (datetime.utcnow() + timedelta(days=7)).strftime("%Y-%m-%d")
    
    records = await db.salud.find({
        "user_id": current_user["id"],
        "proxima_fecha": {"$gte": today, "$lte": week_later}
    }).sort("proxima_fecha", 1).to_list(100)
    
    result = []
    for r in records:
        ave = await db.aves.find_one({"_id": ObjectId(r["ave_id"])})
        record_data = serialize_doc(r)
        if ave:
            record_data["ave_codigo"] = ave.get("codigo")
            record_data["ave_nombre"] = ave.get("nombre")
        result.append(record_data)
    
    return result

@api_router.get("/salud/{salud_id}", response_model=SaludResponse)
async def get_salud_record(salud_id: str, current_user: dict = Depends(get_current_user)):
    record = await db.salud.find_one({"_id": ObjectId(salud_id), "user_id": current_user["id"]})
    if not record:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return SaludResponse(**serialize_doc(record))

@api_router.put("/salud/{salud_id}", response_model=SaludResponse)
async def update_salud(salud_id: str, salud_update: SaludUpdate, current_user: dict = Depends(get_current_user)):
    existing = await db.salud.find_one({"_id": ObjectId(salud_id), "user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    
    update_data = {k: v for k, v in salud_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.salud.update_one({"_id": ObjectId(salud_id)}, {"$set": update_data})
    
    updated = await db.salud.find_one({"_id": ObjectId(salud_id)})
    return SaludResponse(**serialize_doc(updated))

@api_router.delete("/salud/{salud_id}")
async def delete_salud(salud_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.salud.delete_one({"_id": ObjectId(salud_id), "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return {"message": "Registro eliminado"}

# ============== CUIDO ROUTES ==============

@api_router.post("/cuido")
async def create_cuido(cuido: CuidoCreate, current_user: dict = Depends(get_current_user)):
    await ensure_user_can_create_records(current_user["id"], 1)
    ave = await db.aves.find_one({"_id": ObjectId(cuido.ave_id), "user_id": current_user["id"]})
    if not ave:
        raise HTTPException(status_code=404, detail="Ave no encontrada")
    if ave.get("tipo") != "gallo":
        raise HTTPException(status_code=400, detail="Solo se puede crear cuido para gallos")
    
    existing = await db.cuido.find_one({
        "ave_id": cuido.ave_id,
        "user_id": current_user["id"],
        "estado": {"$in": ["activo", "descanso"]}
    })
    if existing:
        raise HTTPException(status_code=400, detail="Este gallo ya tiene un cuido activo")
    
    trabajos = [
        {"numero": i, "tiempo_minutos": None, "completado": False, "fecha_completado": None, "notas": None}
        for i in range(1, 6)
    ]
    
    cuido_doc = {
        "ave_id": cuido.ave_id,
        "fecha_inicio": cuido.fecha_inicio or datetime.utcnow().strftime("%Y-%m-%d"),
        "estado": "activo",
        "tope1_completado": False,
        "tope1_fecha": None,
        "tope1_notas": None,
        "tope2_completado": False,
        "tope2_fecha": None,
        "tope2_notas": None,
        "trabajos": trabajos,
        "en_descanso": False,
        "dias_descanso": None,
        "fecha_inicio_descanso": None,
        "fecha_fin_descanso": None,
        "notas": cuido.notas,
        "user_id": current_user["id"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.cuido.insert_one(cuido_doc)
    cuido_doc["_id"] = result.inserted_id
    
    await increment_user_records_used(current_user["id"], 1)
    
    return serialize_doc(cuido_doc)

@api_router.get("/cuido")
async def get_cuidos(
    estado: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"user_id": current_user["id"]}

    # Mostrar todo por defecto. Solo filtra si realmente se envía un estado válido.
    if estado and estado not in ["todos", "all"]:
        query["estado"] = estado

    cuidos = await db.cuido.find(query).sort("created_at", -1).to_list(1000)

    result = []
    for c in cuidos:
        ave = await db.aves.find_one({"_id": ObjectId(c["ave_id"])})
        cuido_data = serialize_doc(c)
        if ave:
            cuido_data["ave_codigo"] = ave.get("codigo")
            cuido_data["ave_nombre"] = ave.get("nombre")
            cuido_data["ave_foto"] = ave.get("foto_principal")
            cuido_data["ave_color"] = ave.get("color")
            cuido_data["ave_linea"] = ave.get("linea")
        result.append(cuido_data)

    return result

@api_router.get("/cuido/{cuido_id}")
async def get_cuido(cuido_id: str, current_user: dict = Depends(get_current_user)):
    cuido = await db.cuido.find_one({"_id": ObjectId(cuido_id), "user_id": current_user["id"]})
    if not cuido:
        raise HTTPException(status_code=404, detail="Cuido no encontrado")
    
    ave = await db.aves.find_one({"_id": ObjectId(cuido["ave_id"])})
    cuido_data = serialize_doc(cuido)
    if ave:
        cuido_data["ave_codigo"] = ave.get("codigo")
        cuido_data["ave_nombre"] = ave.get("nombre")
        cuido_data["ave_foto"] = ave.get("foto_principal")
        cuido_data["ave_color"] = ave.get("color")
        cuido_data["ave_linea"] = ave.get("linea")
    
    return cuido_data

@api_router.put("/cuido/{cuido_id}")
async def update_cuido(cuido_id: str, cuido_update: CuidoUpdate, current_user: dict = Depends(get_current_user)):
    existing = await db.cuido.find_one({"_id": ObjectId(cuido_id), "user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Cuido no encontrado")
    
    update_data = {k: v for k, v in cuido_update.dict().items() if v is not None}
    
    if "trabajos" in update_data:
        update_data["trabajos"] = [t.dict() if hasattr(t, 'dict') else t for t in update_data["trabajos"]]
    
    update_data["updated_at"] = datetime.utcnow()
    
    await db.cuido.update_one({"_id": ObjectId(cuido_id)}, {"$set": update_data})
    
    updated = await db.cuido.find_one({"_id": ObjectId(cuido_id)})
    return serialize_doc(updated)

@api_router.post("/cuido/{cuido_id}/tope")
async def registrar_tope(
    cuido_id: str,
    tope_numero: int,
    notas: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if tope_numero not in [1, 2]:
        raise HTTPException(status_code=400, detail="Tope debe ser 1 o 2")
    
    cuido = await db.cuido.find_one({"_id": ObjectId(cuido_id), "user_id": current_user["id"]})
    if not cuido:
        raise HTTPException(status_code=404, detail="Cuido no encontrado")
    
    field_completado = f"tope{tope_numero}_completado"
    field_fecha = f"tope{tope_numero}_fecha"
    field_notas = f"tope{tope_numero}_notas"
    
    await db.cuido.update_one(
        {"_id": ObjectId(cuido_id)},
        {"$set": {
            field_completado: True,
            field_fecha: datetime.utcnow().strftime("%Y-%m-%d"),
            field_notas: notas,
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {"message": f"Tope {tope_numero} registrado"}

@api_router.post("/cuido/{cuido_id}/trabajo")
async def registrar_trabajo(
    cuido_id: str,
    trabajo_numero: int,
    tiempo_minutos: int,
    notas: Optional[str] = None,
    peso: Optional[str] = None,
    marcaje_mes: Optional[str] = None,
    marcaje_anio: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    cuido = await db.cuido.find_one({"_id": ObjectId(cuido_id), "user_id": current_user["id"]})
    if not cuido:
        raise HTTPException(status_code=404, detail="Cuido no encontrado")

    trabajos = cuido.get("trabajos", [])

    for t in trabajos:
        if t["numero"] == trabajo_numero:
            t["tiempo_minutos"] = tiempo_minutos
            t["completado"] = True
            t["fecha_completado"] = datetime.utcnow().strftime("%Y-%m-%d")
            t["notas"] = notas
            t["peso"] = peso
            t["marcaje_mes"] = marcaje_mes
            t["marcaje_anio"] = marcaje_anio
            break

    await db.cuido.update_one(
        {"_id": ObjectId(cuido_id)},
        {"$set": {"trabajos": trabajos}}
    )

    return {"message": "ok"}

@api_router.delete("/cuido/{cuido_id}/trabajo/{trabajo_numero}")
async def delete_trabajo(
    cuido_id: str,
    trabajo_numero: int,
    current_user: dict = Depends(get_current_user)
):
    cuido = await db.cuido.find_one({"_id": ObjectId(cuido_id), "user_id": current_user["id"]})
    if not cuido:
        raise HTTPException(status_code=404, detail="Cuido no encontrado")
    
    trabajos = cuido.get("trabajos", [])

    nuevo_trabajos = []
    eliminado = False

    for t in trabajos:
        if t["numero"] == trabajo_numero:
            eliminado = True
            continue

        if t["numero"] > trabajo_numero:
            t["numero"] -= 1

        nuevo_trabajos.append(t)

    if not eliminado:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")

    await db.cuido.update_one(
        {"_id": ObjectId(cuido_id)},
        {"$set": {"trabajos": nuevo_trabajos, "updated_at": datetime.utcnow()}}
    )

    return {"message": "Trabajo eliminado correctamente"}

@api_router.post("/cuido/{cuido_id}/descanso")
async def iniciar_descanso(
    cuido_id: str,
    dias: int,
    current_user: dict = Depends(get_current_user)
):
    if dias < 1 or dias > 20:
        raise HTTPException(status_code=400, detail="Días de descanso debe ser entre 1 y 20")
    
    cuido = await db.cuido.find_one({"_id": ObjectId(cuido_id), "user_id": current_user["id"]})
    if not cuido:
        raise HTTPException(status_code=404, detail="Cuido no encontrado")
    
    fecha_inicio = datetime.utcnow()
    fecha_fin = fecha_inicio + timedelta(days=dias)
    
    await db.cuido.update_one(
        {"_id": ObjectId(cuido_id)},
        {"$set": {
            "en_descanso": True,
            "dias_descanso": dias,
            "fecha_inicio_descanso": fecha_inicio.strftime("%Y-%m-%d"),
            "fecha_fin_descanso": fecha_fin.strftime("%Y-%m-%d"),
            "estado": "descanso",
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {
        "message": f"Descanso de {dias} días iniciado",
        "fecha_fin": fecha_fin.strftime("%Y-%m-%d")
    }

@api_router.post("/cuido/{cuido_id}/finalizar-descanso")
async def finalizar_descanso(cuido_id: str, current_user: dict = Depends(get_current_user)):
    cuido = await db.cuido.find_one({"_id": ObjectId(cuido_id), "user_id": current_user["id"]})
    if not cuido:
        raise HTTPException(status_code=404, detail="Cuido no encontrado")
    
    await db.cuido.update_one(
        {"_id": ObjectId(cuido_id)},
        {"$set": {
            "en_descanso": False,
            "estado": "activo",
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {"message": "Descanso finalizado, gallo vuelve a cuido activo"}

@api_router.post("/cuido/{cuido_id}/finalizar")
async def finalizar_cuido(cuido_id: str, current_user: dict = Depends(get_current_user)):
    cuido = await db.cuido.find_one({"_id": ObjectId(cuido_id), "user_id": current_user["id"]})
    if not cuido:
        raise HTTPException(status_code=404, detail="Cuido no encontrado")
    
    await db.cuido.update_one(
        {"_id": ObjectId(cuido_id)},
        {"$set": {
            "estado": "finalizado",
            "en_descanso": False,
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {"message": "Cuido finalizado"}

@api_router.delete("/cuido/{cuido_id}")
async def delete_cuido(cuido_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.cuido.delete_one({"_id": ObjectId(cuido_id), "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cuido no encontrado")
    return {"message": "Cuido eliminado"}

# ============== DASHBOARD ==============

@api_router.get("/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    aves_activas = await db.aves.count_documents({"user_id": user_id, "estado": "activo"})
    gallos = await db.aves.count_documents({"user_id": user_id, "estado": "activo", "tipo": "gallo"})
    gallinas = await db.aves.count_documents({"user_id": user_id, "estado": "activo", "tipo": "gallina"})
    
    cruces_total = await db.cruces.count_documents({"user_id": user_id})
    cruces_planeados = await db.cruces.count_documents({"user_id": user_id, "estado": "planeado"})
    
    camadas_total = await db.camadas.count_documents({"user_id": user_id})
    camadas_activas = await db.camadas.count_documents({
        "user_id": user_id,
        "fecha_incubacion_inicio": {"$ne": None},
        "fecha_nacimiento": None
    })
    
    recent_peleas = await db.peleas.find({"user_id": user_id}).sort("fecha", -1).limit(5).to_list(5)
    peleas_data = []
    for p in recent_peleas:
        ave = await db.aves.find_one({"_id": ObjectId(p["ave_id"])})
        peleas_data.append({
            "id": str(p["_id"]),
            "fecha": p.get("fecha"),
            "resultado": p.get("resultado"),
            "calificacion": p.get("calificacion"),
            "ave_codigo": ave.get("codigo") if ave else None,
            "ave_nombre": ave.get("nombre") if ave else None
        })
    
    total_peleas = await db.peleas.count_documents({"user_id": user_id})
    peleas_ganadas = await db.peleas.count_documents({"user_id": user_id, "resultado": "GANO"})
    
    today = datetime.utcnow().strftime("%Y-%m-%d")
    week_later = (datetime.utcnow() + timedelta(days=7)).strftime("%Y-%m-%d")
    recordatorios = await db.salud.count_documents({
        "user_id": user_id,
        "proxima_fecha": {"$gte": today, "$lte": week_later}
    })
    
    return {
        "aves": {
            "total_activas": aves_activas,
            "gallos": gallos,
            "gallinas": gallinas
        },
        "cruces_planeados": cruces_planeados,
        "cruces_total": cruces_total,
        "camadas_activas": camadas_activas,
        "camadas_total": camadas_total,
        "peleas": {
            "total": total_peleas,
            "ganadas": peleas_ganadas,
            "perdidas": total_peleas - peleas_ganadas,
            "porcentaje_victorias": round((peleas_ganadas / total_peleas * 100) if total_peleas > 0 else 0, 1),
            "recientes": peleas_data
        },
        "recordatorios_salud": recordatorios
    }

# ============== SYNC ==============

@api_router.post("/sync/upload")
async def sync_upload(data: SyncData, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    results = {"aves": 0, "cruces": 0, "camadas": 0, "peleas": 0, "salud": 0}
    
    for ave in data.aves:
        ave["user_id"] = user_id
        ave["created_at"] = ave.get("created_at") or datetime.utcnow()
        ave["updated_at"] = datetime.utcnow()
        if "id" in ave and ave["id"]:
            try:
                await db.aves.update_one(
                    {"_id": ObjectId(ave["id"]), "user_id": user_id},
                    {"$set": {k: v for k, v in ave.items() if k != "id"}},
                    upsert=True
                )
            except:
                ave.pop("id", None)
                await db.aves.insert_one(ave)
        else:
            ave.pop("id", None)
            await db.aves.insert_one(ave)
        results["aves"] += 1
    
    for cruce in data.cruces:
        cruce["user_id"] = user_id
        cruce["created_at"] = cruce.get("created_at") or datetime.utcnow()
        cruce["updated_at"] = datetime.utcnow()
        if "id" in cruce and cruce["id"]:
            try:
                await db.cruces.update_one(
                    {"_id": ObjectId(cruce["id"]), "user_id": user_id},
                    {"$set": {k: v for k, v in cruce.items() if k != "id"}},
                    upsert=True
                )
            except:
                cruce.pop("id", None)
                await db.cruces.insert_one(cruce)
        else:
            cruce.pop("id", None)
            await db.cruces.insert_one(cruce)
        results["cruces"] += 1
    
    return {"message": "Sincronización completada", "results": results}

@api_router.get("/sync/download")
async def sync_download(since: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    query = {"user_id": user_id}
    
    if since:
        try:
            since_date = datetime.fromisoformat(since)
            query["updated_at"] = {"$gte": since_date}
        except:
            pass
    
    aves = await db.aves.find(query).to_list(10000)
    cruces = await db.cruces.find(query).to_list(10000)
    camadas = await db.camadas.find(query).to_list(10000)
    peleas = await db.peleas.find(query).to_list(10000)
    salud = await db.salud.find(query).to_list(10000)
    
    return {
        "aves": [serialize_doc(a) for a in aves],
        "cruces": [serialize_doc(c) for c in cruces],
        "camadas": [serialize_doc(c) for c in camadas],
        "peleas": [serialize_doc(p) for p in peleas],
        "salud": [serialize_doc(s) for s in salud],
        "sync_time": datetime.utcnow().isoformat()
    }

# ============== HEALTH CHECK ==============

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_indexes():
    await db.aves.create_index([("user_id", 1), ("created_at", -1)])
    await db.aves.create_index([("user_id", 1), ("estado", 1), ("created_at", -1)])
    await db.aves.create_index([("user_id", 1), ("tipo", 1), ("created_at", -1)])

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()