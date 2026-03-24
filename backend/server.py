from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import jwt
import bcrypt
from bson import ObjectId
from bson.errors import InvalidId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mongo_url = os.environ.get("MONGO_URL")

if not mongo_url:
    raise RuntimeError("MONGO_URL is not set in environment variables")

print("Mongo URL loaded:", mongo_url[:25], "...")
db_name = os.environ.get("DB_NAME", "castador_pro")
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

JWT_SECRET = os.environ.get("JWT_SECRET")
if not JWT_SECRET:
    JWT_SECRET = "castador-pro-secret-key-2025-dev"
    logger.warning("JWT_SECRET not set, using development default. Set JWT_SECRET in production!")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

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
        raise ValueError("Invalid ObjectId")


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


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class AveBase(BaseModel):
    tipo: str
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


class CruceResponse(CruceBase):
    id: str
    user_id: str
    consanguinidad_estimado: Optional[float] = None
    created_at: datetime
    updated_at: datetime


class CamadaBase(BaseModel):
    cruce_id: str
    fecha_puesta_inicio: Optional[str] = None
    cantidad_huevos: Optional[int] = None
    fecha_incubacion_inicio: Optional[str] = None
    metodo: str = "gallina"
    fecha_nacimiento: Optional[str] = None
    pollitos_nacidos: Optional[int] = None
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
    notas: Optional[str] = None


class CamadaResponse(CamadaBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


class PeleaBase(BaseModel):
    ave_id: str
    fecha: str
    lugar: Optional[str] = None
    resultado: str
    calificacion: str
    notas: Optional[str] = None


class PeleaCreate(PeleaBase):
    pass


class PeleaUpdate(BaseModel):
    ave_id: Optional[str] = None
    fecha: Optional[str] = None
    lugar: Optional[str] = None
    resultado: Optional[str] = None
    calificacion: Optional[str] = None
    notas: Optional[str] = None


class PeleaResponse(PeleaBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


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


def serialize_doc(doc: dict) -> dict:
    if doc is None:
        return None
    result = {"id": str(doc["_id"])}
    for k, v in doc.items():
        if k != "_id":
            if isinstance(v, ObjectId):
                result[k] = str(v)
            else:
                result[k] = v
    return result


def clean_optional_id(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, str):
        value = value.strip()
        if value == "":
            return None
    return value


def to_object_id(value: str, field_name: str = "id") -> ObjectId:
    value = clean_optional_id(value)
    if not value:
        raise HTTPException(status_code=400, detail=f"{field_name} inválido")
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail=f"{field_name} inválido")


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="No autorizado")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token inválido")

        user = await db.users.find_one({"_id": to_object_id(user_id, "user_id")})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")

        return {
            "id": str(user["_id"]),
            **{k: v for k, v in user.items() if k not in ["_id", "pin"]}
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")


# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"telefono": user_data.telefono})
    if existing:
        raise HTTPException(status_code=400, detail="Este número ya está registrado")

    if not user_data.pin.isdigit() or len(user_data.pin) < 4 or len(user_data.pin) > 6:
        raise HTTPException(status_code=400, detail="El PIN debe ser de 4 a 6 dígitos")

    now = datetime.utcnow()

    user_doc = {
        "telefono": user_data.telefono,
        "email": user_data.email,
        "nombre": user_data.nombre,
        "pin": hash_pin(user_data.pin),
        "created_at": now,
        "updated_at": now,
    }

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    token = create_token(user_id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "telefono": user_doc["telefono"],
            "email": user_doc.get("email"),
            "nombre": user_doc.get("nombre"),
            "created_at": user_doc["created_at"],
        },
    }


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
        user=UserResponse(
            id=user_id,
            telefono=user["telefono"],
            email=user.get("email"),
            nombre=user.get("nombre"),
            created_at=user["created_at"],
        ),
    )


@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)


class ProfileUpdate(BaseModel):
    email: Optional[str] = None
    nombre: Optional[str] = None


@api_router.put("/auth/profile")
async def update_profile(data: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {"updated_at": datetime.utcnow()}
    if data.email is not None:
        update_data["email"] = data.email
    if data.nombre is not None:
        update_data["nombre"] = data.nombre

    await db.users.update_one(
        {"_id": to_object_id(current_user["id"], "user_id")},
        {"$set": update_data},
    )

    updated_user = await db.users.find_one({"_id": to_object_id(current_user["id"], "user_id")})
    return {
        "message": "Perfil actualizado",
        "user": {
            "id": str(updated_user["_id"]),
            "telefono": updated_user["telefono"],
            "email": updated_user.get("email"),
            "nombre": updated_user.get("nombre"),
            "created_at": updated_user["created_at"],
        },
    }


class ChangePinRequest(BaseModel):
    current_pin: str
    new_pin: str


@api_router.put("/auth/change-pin")
async def change_pin(data: ChangePinRequest, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"_id": to_object_id(current_user["id"], "user_id")})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if not verify_pin(data.current_pin, user["pin"]):
        raise HTTPException(status_code=400, detail="PIN actual incorrecto")

    if not data.new_pin.isdigit() or len(data.new_pin) < 4 or len(data.new_pin) > 6:
        raise HTTPException(status_code=400, detail="El nuevo PIN debe ser de 4 a 6 dígitos")

    await db.users.update_one(
        {"_id": to_object_id(current_user["id"], "user_id")},
        {"$set": {"pin": hash_pin(data.new_pin), "updated_at": datetime.utcnow()}},
    )

    return {"message": "PIN actualizado correctamente"}


@api_router.delete("/auth/delete-account")
async def delete_account(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    await db.aves.delete_many({"user_id": user_id})
    await db.cruces.delete_many({"user_id": user_id})
    await db.camadas.delete_many({"user_id": user_id})
    await db.peleas.delete_many({"user_id": user_id})
    await db.salud.delete_many({"user_id": user_id})
    await db.cuido.delete_many({"user_id": user_id})

    result = await db.users.delete_one({"_id": to_object_id(user_id, "user_id")})
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
        "peleas": peleas_count,
    }


# ============== AVES ROUTES ==============

@api_router.post("/aves", response_model=AveResponse)
async def create_ave(ave: AveCreate, current_user: dict = Depends(get_current_user)):
    padre_id = clean_optional_id(ave.padre_id)
    madre_id = clean_optional_id(ave.madre_id)

    if padre_id:
        padre = await db.aves.find_one({
            "_id": to_object_id(padre_id, "padre_id"),
            "user_id": current_user["id"],
        })
        if not padre:
            raise HTTPException(status_code=404, detail="Padre no encontrado")
        if padre.get("tipo") != "gallo":
            raise HTTPException(status_code=400, detail="El padre debe ser un gallo")

    if madre_id:
        madre = await db.aves.find_one({
            "_id": to_object_id(madre_id, "madre_id"),
            "user_id": current_user["id"],
        })
        if not madre:
            raise HTTPException(status_code=404, detail="Madre no encontrada")
        if madre.get("tipo") != "gallina":
            raise HTTPException(status_code=400, detail="La madre debe ser una gallina")

    now = datetime.utcnow()
    ave_doc = {
        **ave.dict(),
        "padre_id": padre_id,
        "madre_id": madre_id,
        "user_id": current_user["id"],
        "created_at": now,
        "updated_at": now,
    }

    result = await db.aves.insert_one(ave_doc)
    ave_doc["_id"] = result.inserted_id

    return serialize_doc(ave_doc)


@api_router.get("/aves", response_model=List[AveResponse])
async def get_aves(
    tipo: Optional[str] = None,
    estado: Optional[str] = None,
    color: Optional[str] = None,
    linea: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    query = {"user_id": current_user["id"]}
    if tipo:
        query["tipo"] = tipo
    if estado:
        query["estado"] = estado
    if color:
        query["color"] = {"$regex": color, "$options": "i"}
    if linea:
        query["linea"] = {"$regex": linea, "$options": "i"}

    aves = await db.aves.find(query).sort("created_at", -1).to_list(1000)

    result = []
    for ave in aves:
        data = serialize_doc(ave)

        if not data.get("created_at"):
            data["created_at"] = datetime.utcnow()

        if not data.get("updated_at"):
            data["updated_at"] = data["created_at"]

        result.append(AveResponse(**data))

    return result


@api_router.get("/aves/{ave_id}", response_model=AveResponse)
async def get_ave(ave_id: str, current_user: dict = Depends(get_current_user)):
    ave = await db.aves.find_one({
        "_id": to_object_id(ave_id, "ave_id"),
        "user_id": current_user["id"],
    })

    if not ave:
        raise HTTPException(status_code=404, detail="Ave no encontrada")

    data = serialize_doc(ave)

    if not data.get("created_at"):
        data["created_at"] = datetime.utcnow()

    if not data.get("updated_at"):
        data["updated_at"] = data["created_at"]

    return AveResponse(**data)


@api_router.put("/aves/{ave_id}", response_model=AveResponse)
async def update_ave(ave_id: str, ave_update: AveUpdate, current_user: dict = Depends(get_current_user)):
    existing = await db.aves.find_one({
        "_id": to_object_id(ave_id, "ave_id"),
        "user_id": current_user["id"],
    })
    if not existing:
        raise HTTPException(status_code=404, detail="Ave no encontrada")

    update_data = {k: v for k, v in ave_update.dict().items() if v is not None}

    if "padre_id" in update_data:
        update_data["padre_id"] = clean_optional_id(update_data["padre_id"])
        if update_data["padre_id"]:
            padre = await db.aves.find_one({
                "_id": to_object_id(update_data["padre_id"], "padre_id"),
                "user_id": current_user["id"],
            })
            if not padre:
                raise HTTPException(status_code=404, detail="Padre no encontrado")
            if padre.get("tipo") != "gallo":
                raise HTTPException(status_code=400, detail="El padre debe ser un gallo")

    if "madre_id" in update_data:
        update_data["madre_id"] = clean_optional_id(update_data["madre_id"])
        if update_data["madre_id"]:
            madre = await db.aves.find_one({
                "_id": to_object_id(update_data["madre_id"], "madre_id"),
                "user_id": current_user["id"],
            })
            if not madre:
                raise HTTPException(status_code=404, detail="Madre no encontrada")
            if madre.get("tipo") != "gallina":
                raise HTTPException(status_code=400, detail="La madre debe ser una gallina")

    update_data["updated_at"] = datetime.utcnow()

    await db.aves.update_one(
        {"_id": to_object_id(ave_id, "ave_id")},
        {"$set": update_data},
    )

    updated = await db.aves.find_one({"_id": to_object_id(ave_id, "ave_id")})
    return AveResponse(**serialize_doc(updated))


@api_router.delete("/aves/{ave_id}")
async def delete_ave(ave_id: str, current_user: dict = Depends(get_current_user)):
    children = await db.aves.count_documents({
        "user_id": current_user["id"],
        "$or": [{"padre_id": ave_id}, {"madre_id": ave_id}],
    })

    cruces = await db.cruces.count_documents({
        "user_id": current_user["id"],
        "$or": [{"padre_id": ave_id}, {"madre_id": ave_id}],
    })

    result = await db.aves.delete_one({
        "_id": to_object_id(ave_id, "ave_id"),
        "user_id": current_user["id"],
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ave no encontrada")

    await db.peleas.delete_many({"ave_id": ave_id, "user_id": current_user["id"]})
    await db.salud.delete_many({"ave_id": ave_id, "user_id": current_user["id"]})

    return {
        "message": "Ave eliminada",
        "warning": f"Esta ave era padre/madre de {children} aves y estaba en {cruces} cruces"
        if children > 0 or cruces > 0 else None,
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
                "generation": gen,
            }

        if not bird_id:
            return None

        bird = await db.aves.find_one({
            "_id": to_object_id(bird_id, "bird_id"),
            "user_id": current_user["id"],
        })
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
            "generation": gen,
        }

        if gen < generations:
            if bird.get("padre_id"):
                result["padre"] = await get_ancestors(bird.get("padre_id"), gen + 1)
            elif bird.get("padre_externo"):
                padre_ext = await get_ancestors(None, gen + 1, {
                    "codigo": bird.get("padre_externo"),
                    "tipo": "gallo",
                    "galleria": bird.get("padre_galleria"),
                })
                if gen + 1 < generations:
                    if bird.get("abuelo_paterno_padre"):
                        padre_ext["padre"] = {
                            "codigo": bird.get("abuelo_paterno_padre"),
                            "galleria": bird.get("abuelo_paterno_padre_galleria"),
                            "tipo": "gallo",
                            "externo": True,
                            "generation": gen + 2,
                        }
                    if bird.get("abuelo_paterno_madre"):
                        padre_ext["madre"] = {
                            "codigo": bird.get("abuelo_paterno_madre"),
                            "galleria": bird.get("abuelo_paterno_madre_galleria"),
                            "tipo": "gallina",
                            "externo": True,
                            "generation": gen + 2,
                        }
                result["padre"] = padre_ext

            if bird.get("madre_id"):
                result["madre"] = await get_ancestors(bird.get("madre_id"), gen + 1)
            elif bird.get("madre_externo"):
                madre_ext = await get_ancestors(None, gen + 1, {
                    "codigo": bird.get("madre_externo"),
                    "tipo": "gallina",
                    "galleria": bird.get("madre_galleria"),
                })
                if gen + 1 < generations:
                    if bird.get("abuelo_materno_padre"):
                        madre_ext["padre"] = {
                            "codigo": bird.get("abuelo_materno_padre"),
                            "galleria": bird.get("abuelo_materno_padre_galleria"),
                            "tipo": "gallo",
                            "externo": True,
                            "generation": gen + 2,
                        }
                    if bird.get("abuelo_materno_madre"):
                        madre_ext["madre"] = {
                            "codigo": bird.get("abuelo_materno_madre"),
                            "galleria": bird.get("abuelo_materno_madre_galleria"),
                            "tipo": "gallina",
                            "externo": True,
                            "generation": gen + 2,
                        }
                result["madre"] = madre_ext

        return result

    ave = await db.aves.find_one({
        "_id": to_object_id(ave_id, "ave_id"),
        "user_id": current_user["id"],
    })
    if not ave:
        raise HTTPException(status_code=404, detail="Ave no encontrada")

    return await get_ancestors(ave_id, 1)


@api_router.get("/aves/{ave_id}/hijos", response_model=List[AveResponse])
async def get_hijos(ave_id: str, current_user: dict = Depends(get_current_user)):
    ave = await db.aves.find_one({
        "_id": to_object_id(ave_id, "ave_id"),
        "user_id": current_user["id"],
    })
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
    current_user: dict = Depends(get_current_user),
):
    async def get_all_ancestors(bird_id: str, gen: int, max_gen: int = 5) -> List[tuple]:
        if gen > max_gen or not bird_id:
            return []

        ancestors = [(bird_id, gen)]
        bird = await db.aves.find_one({
            "_id": to_object_id(bird_id, "bird_id"),
            "user_id": current_user["id"],
        })
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
            ave = await db.aves.find_one({"_id": to_object_id(aid, "ancestor_id")})
            if ave:
                common.append({
                    "id": aid,
                    "codigo": ave.get("codigo"),
                    "nombre": ave.get("nombre"),
                    "generation_padre": gen,
                    "generation_madre": madre_ids[aid],
                    "closest_generation": min_gen,
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
        "total_comunes": len(common),
    }


# ============== CRIADORES / CASTADORES ROUTES ==============

@api_router.get("/criadores")
async def get_criadores(current_user: dict = Depends(get_current_user)):
    results = []

    if current_user.get("nombre"):
        results.append({
            "id": current_user["id"],
            "nombre": current_user["nombre"],
        })

    aves = await db.aves.find(
        {
            "user_id": current_user["id"],
            "castado_por": {"$exists": True, "$nin": [None, ""]},
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
                "nombre": nombre,
            })
            seen_names.add(nombre.lower())

    return results


@api_router.get("/castadores")
async def get_castadores(current_user: dict = Depends(get_current_user)):
    return await get_criadores(current_user)


# ============== CRUCES ROUTES ==============

@api_router.post("/cruces", response_model=CruceResponse)
async def create_cruce(cruce: CruceCreate, current_user: dict = Depends(get_current_user)):
    padre_id = clean_optional_id(cruce.padre_id)
    madre_id = clean_optional_id(cruce.madre_id)

    if padre_id:
        padre = await db.aves.find_one({
            "_id": to_object_id(padre_id, "padre_id"),
            "user_id": current_user["id"],
        })
        if not padre:
            raise HTTPException(status_code=404, detail="Padre no encontrado")
        if padre.get("tipo") != "gallo":
            raise HTTPException(status_code=400, detail="El padre debe ser un gallo")
    elif not clean_optional_id(cruce.padre_externo):
        raise HTTPException(status_code=400, detail="Debes seleccionar o agregar un padre")

    if madre_id:
        madre = await db.aves.find_one({
            "_id": to_object_id(madre_id, "madre_id"),
            "user_id": current_user["id"],
        })
        if not madre:
            raise HTTPException(status_code=404, detail="Madre no encontrada")
        if madre.get("tipo") != "gallina":
            raise HTTPException(status_code=400, detail="La madre debe ser una gallina")
    elif not clean_optional_id(cruce.madre_externo):
        raise HTTPException(status_code=400, detail="Debes seleccionar o agregar una madre")

    consanguinidad_estimado = 0.0
    if padre_id and madre_id:
        consang_result = await calculate_consanguinidad(padre_id, madre_id, current_user)
        consanguinidad_estimado = consang_result["porcentaje_estimado"]

    now = datetime.utcnow()
    cruce_doc = {
        **cruce.dict(),
        "padre_id": padre_id,
        "madre_id": madre_id,
        "user_id": current_user["id"],
        "consanguinidad_estimado": consanguinidad_estimado,
        "created_at": now,
        "updated_at": now,
    }

    result = await db.cruces.insert_one(cruce_doc)
    cruce_doc["_id"] = result.inserted_id

    return CruceResponse(**serialize_doc(cruce_doc))


@api_router.get("/cruces", response_model=List[CruceResponse])
async def get_cruces(estado: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user["id"]}
    if estado:
        query["estado"] = estado

    cruces = await db.cruces.find(query).sort("created_at", -1).to_list(1000)
    return [CruceResponse(**serialize_doc(c)) for c in cruces]


@api_router.get("/cruces/{cruce_id}", response_model=CruceResponse)
async def get_cruce(cruce_id: str, current_user: dict = Depends(get_current_user)):
    cruce = await db.cruces.find_one({
        "_id": to_object_id(cruce_id, "cruce_id"),
        "user_id": current_user["id"],
    })
    if not cruce:
        raise HTTPException(status_code=404, detail="Cruce no encontrado")
    return CruceResponse(**serialize_doc(cruce))


@api_router.put("/cruces/{cruce_id}", response_model=CruceResponse)
async def update_cruce(cruce_id: str, cruce_update: CruceUpdate, current_user: dict = Depends(get_current_user)):
    existing = await db.cruces.find_one({
        "_id": to_object_id(cruce_id, "cruce_id"),
        "user_id": current_user["id"],
    })
    if not existing:
        raise HTTPException(status_code=404, detail="Cruce no encontrado")

    update_data = {k: v for k, v in cruce_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()

    padre_id = clean_optional_id(update_data.get("padre_id", existing.get("padre_id")))
    madre_id = clean_optional_id(update_data.get("madre_id", existing.get("madre_id")))

    if "padre_id" in update_data:
        update_data["padre_id"] = padre_id
    if "madre_id" in update_data:
        update_data["madre_id"] = madre_id

    if padre_id:
        padre = await db.aves.find_one({
            "_id": to_object_id(padre_id, "padre_id"),
            "user_id": current_user["id"],
        })
        if not padre:
            raise HTTPException(status_code=404, detail="Padre no encontrado")
        if padre.get("tipo") != "gallo":
            raise HTTPException(status_code=400, detail="El padre debe ser un gallo")

    if madre_id:
        madre = await db.aves.find_one({
            "_id": to_object_id(madre_id, "madre_id"),
            "user_id": current_user["id"],
        })
        if not madre:
            raise HTTPException(status_code=404, detail="Madre no encontrada")
        if madre.get("tipo") != "gallina":
            raise HTTPException(status_code=400, detail="La madre debe ser una gallina")

    if padre_id and madre_id:
        consang_result = await calculate_consanguinidad(padre_id, madre_id, current_user)
        update_data["consanguinidad_estimado"] = consang_result["porcentaje_estimado"]

    await db.cruces.update_one(
        {"_id": to_object_id(cruce_id, "cruce_id")},
        {"$set": update_data},
    )

    updated = await db.cruces.find_one({"_id": to_object_id(cruce_id, "cruce_id")})
    return CruceResponse(**serialize_doc(updated))


@api_router.delete("/cruces/{cruce_id}")
async def delete_cruce(cruce_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.cruces.delete_one({
        "_id": to_object_id(cruce_id, "cruce_id"),
        "user_id": current_user["id"],
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cruce no encontrado")
    return {"message": "Cruce eliminado"}


# ============== CAMADAS ROUTES ==============

@api_router.post("/camadas", response_model=CamadaResponse)
async def create_camada(camada: CamadaCreate, current_user: dict = Depends(get_current_user)):
    cruce = await db.cruces.find_one({
        "_id": to_object_id(camada.cruce_id, "cruce_id"),
        "user_id": current_user["id"],
    })
    if not cruce:
        raise HTTPException(status_code=404, detail="Cruce no encontrado")

    now = datetime.utcnow()
    camada_doc = {
        **camada.dict(),
        "user_id": current_user["id"],
        "created_at": now,
        "updated_at": now,
    }

    result = await db.camadas.insert_one(camada_doc)
    camada_doc["_id"] = result.inserted_id

    await db.cruces.update_one(
        {"_id": to_object_id(camada.cruce_id, "cruce_id")},
        {"$set": {"estado": "hecho"}},
    )

    return CamadaResponse(**serialize_doc(camada_doc))


@api_router.get("/camadas", response_model=List[CamadaResponse])
async def get_camadas(current_user: dict = Depends(get_current_user)):
    camadas = await db.camadas.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(1000)
    return [CamadaResponse(**serialize_doc(c)) for c in camadas]


@api_router.get("/camadas/{camada_id}", response_model=CamadaResponse)
async def get_camada(camada_id: str, current_user: dict = Depends(get_current_user)):
    camada = await db.camadas.find_one({
        "_id": to_object_id(camada_id, "camada_id"),
        "user_id": current_user["id"],
    })
    if not camada:
        raise HTTPException(status_code=404, detail="Camada no encontrada")
    return CamadaResponse(**serialize_doc(camada))


@api_router.put("/camadas/{camada_id}", response_model=CamadaResponse)
async def update_camada(camada_id: str, camada_update: CamadaUpdate, current_user: dict = Depends(get_current_user)):
    existing = await db.camadas.find_one({
        "_id": to_object_id(camada_id, "camada_id"),
        "user_id": current_user["id"],
    })
    if not existing:
        raise HTTPException(status_code=404, detail="Camada no encontrada")

    update_data = {k: v for k, v in camada_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()

    await db.camadas.update_one(
        {"_id": to_object_id(camada_id, "camada_id")},
        {"$set": update_data},
    )

    updated = await db.camadas.find_one({"_id": to_object_id(camada_id, "camada_id")})
    return CamadaResponse(**serialize_doc(updated))


@api_router.post("/camadas/{camada_id}/crear-pollitos")
async def crear_pollitos(camada_id: str, cantidad: int, current_user: dict = Depends(get_current_user)):
    if cantidad < 1:
        raise HTTPException(status_code=400, detail="La cantidad debe ser mayor que 0")

    camada = await db.camadas.find_one({
        "_id": to_object_id(camada_id, "camada_id"),
        "user_id": current_user["id"],
    })
    if not camada:
        raise HTTPException(status_code=404, detail="Camada no encontrada")

    cruce = await db.cruces.find_one({
        "_id": to_object_id(camada["cruce_id"], "cruce_id"),
        "user_id": current_user["id"],
    })
    if not cruce:
        raise HTTPException(status_code=404, detail="Cruce no encontrado")

    created_aves = []
    for i in range(cantidad):
        now = datetime.utcnow()
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
            "padre_externo": cruce.get("padre_externo"),
            "madre_externo": cruce.get("madre_externo"),
            "marcaje_qr": None,
            "user_id": current_user["id"],
            "created_at": now,
            "updated_at": now,
        }
        result = await db.aves.insert_one(ave_doc)
        ave_doc["_id"] = result.inserted_id
        created_aves.append(serialize_doc(ave_doc))

    await db.camadas.update_one(
        {"_id": to_object_id(camada_id, "camada_id")},
        {"$set": {"pollitos_nacidos": cantidad, "updated_at": datetime.utcnow()}},
    )

    return {
        "message": f"{cantidad} pollitos creados",
        "aves": created_aves,
    }


@api_router.delete("/camadas/{camada_id}")
async def delete_camada(camada_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.camadas.delete_one({
        "_id": to_object_id(camada_id, "camada_id"),
        "user_id": current_user["id"],
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Camada no encontrada")
    return {"message": "Camada eliminada"}


# ============== PELEAS ROUTES ==============

@api_router.post("/peleas", response_model=PeleaResponse)
async def create_pelea(pelea: PeleaCreate, current_user: dict = Depends(get_current_user)):
    ave = await db.aves.find_one({
        "_id": to_object_id(pelea.ave_id, "ave_id"),
        "user_id": current_user["id"],
    })
    if not ave:
        raise HTTPException(status_code=404, detail="Ave no encontrada")

    now = datetime.utcnow()
    pelea_doc = {
        **pelea.dict(),
        "user_id": current_user["id"],
        "created_at": now,
        "updated_at": now,
    }

    result = await db.peleas.insert_one(pelea_doc)
    pelea_doc["_id"] = result.inserted_id

    return PeleaResponse(**serialize_doc(pelea_doc))


@api_router.get("/peleas", response_model=List[PeleaResponse])
async def get_peleas(
    ave_id: Optional[str] = None,
    resultado: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    query = {"user_id": current_user["id"]}
    if ave_id:
        query["ave_id"] = ave_id
    if resultado:
        query["resultado"] = resultado

    peleas = await db.peleas.find(query).sort("fecha", -1).to_list(1000)
    return [PeleaResponse(**serialize_doc(p)) for p in peleas]


@api_router.get("/peleas/estadisticas")
async def get_estadisticas_peleas(
    ave_id: Optional[str] = None,
    linea: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    query = {"user_id": current_user["id"]}
    if ave_id:
        query["ave_id"] = ave_id

    peleas = await db.peleas.find(query).to_list(1000)

    if linea:
        aves_linea = await db.aves.find({
            "user_id": current_user["id"],
            "linea": {"$regex": linea, "$options": "i"},
        }).to_list(1000)
        ave_ids = [str(a["_id"]) for a in aves_linea]
        peleas = [p for p in peleas if p.get("ave_id") in ave_ids]

    total = len(peleas)
    ganadas = len([p for p in peleas if p.get("resultado") == "GANO"])
    perdidas = len([p for p in peleas if p.get("resultado") == "PERDIO"])

    calificaciones = {
        "EXTRAORDINARIA": 0,
        "BUENA": 0,
        "REGULAR": 0,
        "MALA": 0,
    }
    for p in peleas:
        cal = p.get("calificacion")
        if cal in calificaciones:
            calificaciones[cal] += 1

    sorted_peleas = sorted(peleas, key=lambda x: x.get("fecha", ""), reverse=True)
    racha_actual = 0
    racha_tipo = None
    if sorted_peleas:
        racha_tipo = sorted_peleas[0].get("resultado")
        for p in sorted_peleas:
            if p.get("resultado") == racha_tipo:
                racha_actual += 1
            else:
                break

    return {
        "total": total,
        "ganadas": ganadas,
        "perdidas": perdidas,
        "porcentaje_victorias": round((ganadas / total * 100) if total > 0 else 0, 1),
        "calificaciones": calificaciones,
        "racha_actual": racha_actual,
        "racha_tipo": racha_tipo,
    }


@api_router.get("/peleas/estadisticas-padres")
async def get_estadisticas_padres(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    peleas = await db.peleas.find({"user_id": user_id}).to_list(10000)
    if not peleas:
        return {"padres": [], "madres": []}

    aves = await db.aves.find({"user_id": user_id}).to_list(10000)
    aves_map = {str(a["_id"]): a for a in aves}

    padre_stats = {}
    madre_stats = {}

    for pelea in peleas:
        ave_id = pelea.get("ave_id")
        ave = aves_map.get(ave_id)
        if not ave:
            continue

        resultado = pelea.get("resultado")
        gano = 1 if resultado == "GANO" else 0

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
                    "hijos_ids": set(),
                }
            padre_stats[padre_id]["ganadas"] += gano
            padre_stats[padre_id]["total"] += 1
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
                    "hijos_ids": set(),
                }
            madre_stats[madre_id]["ganadas"] += gano
            madre_stats[madre_id]["total"] += 1
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
            "hijos_peleados": len(data["hijos_ids"]),
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
            "hijos_peleados": len(data["hijos_ids"]),
        })

    padres_list.sort(key=lambda x: (-x["porcentaje"], -x["total"]))
    madres_list.sort(key=lambda x: (-x["porcentaje"], -x["total"]))

    return {
        "padres": padres_list[:10],
        "madres": madres_list[:10],
    }


@api_router.get("/peleas/{pelea_id}", response_model=PeleaResponse)
async def get_pelea(pelea_id: str, current_user: dict = Depends(get_current_user)):
    pelea = await db.peleas.find_one({
        "_id": to_object_id(pelea_id, "pelea_id"),
        "user_id": current_user["id"],
    })
    if not pelea:
        raise HTTPException(status_code=404, detail="Pelea no encontrada")
    return PeleaResponse(**serialize_doc(pelea))


@api_router.put("/peleas/{pelea_id}", response_model=PeleaResponse)
async def update_pelea(pelea_id: str, pelea_update: PeleaUpdate, current_user: dict = Depends(get_current_user)):
    existing = await db.peleas.find_one({
        "_id": to_object_id(pelea_id, "pelea_id"),
        "user_id": current_user["id"],
    })
    if not existing:
        raise HTTPException(status_code=404, detail="Pelea no encontrada")

    update_data = {k: v for k, v in pelea_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()

    await db.peleas.update_one(
        {"_id": to_object_id(pelea_id, "pelea_id")},
        {"$set": update_data},
    )

    updated = await db.peleas.find_one({"_id": to_object_id(pelea_id, "pelea_id")})
    return PeleaResponse(**serialize_doc(updated))


@api_router.delete("/peleas/{pelea_id}")
async def delete_pelea(pelea_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.peleas.delete_one({
        "_id": to_object_id(pelea_id, "pelea_id"),
        "user_id": current_user["id"],
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pelea no encontrada")
    return {"message": "Pelea eliminada"}


# ============== SALUD ROUTES ==============

@api_router.post("/salud", response_model=SaludResponse)
async def create_salud(salud: SaludCreate, current_user: dict = Depends(get_current_user)):
    ave = await db.aves.find_one({
        "_id": to_object_id(salud.ave_id, "ave_id"),
        "user_id": current_user["id"],
    })
    if not ave:
        raise HTTPException(status_code=404, detail="Ave no encontrada")

    now = datetime.utcnow()
    salud_doc = {
        **salud.dict(),
        "user_id": current_user["id"],
        "created_at": now,
        "updated_at": now,
    }

    result = await db.salud.insert_one(salud_doc)
    salud_doc["_id"] = result.inserted_id

    return SaludResponse(**serialize_doc(salud_doc))


@api_router.get("/salud", response_model=List[SaludResponse])
async def get_salud_records(
    ave_id: Optional[str] = None,
    tipo: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
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
        "proxima_fecha": {"$gte": today, "$lte": week_later},
    }).sort("proxima_fecha", 1).to_list(100)

    result = []
    for r in records:
        record_data = serialize_doc(r)
        ave_id = r.get("ave_id")
        if ave_id:
            try:
                ave = await db.aves.find_one({"_id": to_object_id(ave_id, "ave_id")})
            except HTTPException:
                ave = None
            if ave:
                record_data["ave_codigo"] = ave.get("codigo")
                record_data["ave_nombre"] = ave.get("nombre")
        result.append(record_data)

    return result


@api_router.get("/salud/{salud_id}", response_model=SaludResponse)
async def get_salud_record(salud_id: str, current_user: dict = Depends(get_current_user)):
    record = await db.salud.find_one({
        "_id": to_object_id(salud_id, "salud_id"),
        "user_id": current_user["id"],
    })
    if not record:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return SaludResponse(**serialize_doc(record))


@api_router.put("/salud/{salud_id}", response_model=SaludResponse)
async def update_salud(salud_id: str, salud_update: SaludUpdate, current_user: dict = Depends(get_current_user)):
    existing = await db.salud.find_one({
        "_id": to_object_id(salud_id, "salud_id"),
        "user_id": current_user["id"],
    })
    if not existing:
        raise HTTPException(status_code=404, detail="Registro no encontrado")

    update_data = {k: v for k, v in salud_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()

    await db.salud.update_one(
        {"_id": to_object_id(salud_id, "salud_id")},
        {"$set": update_data},
    )

    updated = await db.salud.find_one({"_id": to_object_id(salud_id, "salud_id")})
    return SaludResponse(**serialize_doc(updated))


@api_router.delete("/salud/{salud_id}")
async def delete_salud(salud_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.salud.delete_one({
        "_id": to_object_id(salud_id, "salud_id"),
        "user_id": current_user["id"],
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return {"message": "Registro eliminado"}


# ============== CUIDO ROUTES ==============

@api_router.post("/cuido")
async def create_cuido(cuido: CuidoCreate, current_user: dict = Depends(get_current_user)):
    ave = await db.aves.find_one({
        "_id": to_object_id(cuido.ave_id, "ave_id"),
        "user_id": current_user["id"],
    })
    if not ave:
        raise HTTPException(status_code=404, detail="Ave no encontrada")
    if ave.get("tipo") != "gallo":
        raise HTTPException(status_code=400, detail="Solo se puede crear cuido para gallos")

    existing = await db.cuido.find_one({
        "ave_id": cuido.ave_id,
        "user_id": current_user["id"],
        "estado": {"$in": ["activo", "descanso"]},
    })
    if existing:
        raise HTTPException(status_code=400, detail="Este gallo ya tiene un cuido activo")

    trabajos = [
        {"numero": i, "tiempo_minutos": None, "completado": False, "fecha_completado": None, "notas": None}
        for i in range(1, 6)
    ]

    now = datetime.utcnow()
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
        "created_at": now,
        "updated_at": now,
    }

    result = await db.cuido.insert_one(cuido_doc)
    cuido_doc["_id"] = result.inserted_id

    return serialize_doc(cuido_doc)


@api_router.get("/cuido")
async def get_cuidos(estado: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user["id"]}
    if estado:
        query["estado"] = estado

    cuidos = await db.cuido.find(query).sort("created_at", -1).to_list(1000)

    result = []
    for c in cuidos:
        cuido_data = serialize_doc(c)
        ave_id = c.get("ave_id")
        if ave_id:
            try:
                ave = await db.aves.find_one({"_id": to_object_id(ave_id, "ave_id")})
            except HTTPException:
                ave = None
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
    cuido = await db.cuido.find_one({
        "_id": to_object_id(cuido_id, "cuido_id"),
        "user_id": current_user["id"],
    })
    if not cuido:
        raise HTTPException(status_code=404, detail="Cuido no encontrado")

    cuido_data = serialize_doc(cuido)
    ave_id = cuido.get("ave_id")
    if ave_id:
        try:
            ave = await db.aves.find_one({"_id": to_object_id(ave_id, "ave_id")})
        except HTTPException:
            ave = None
        if ave:
            cuido_data["ave_codigo"] = ave.get("codigo")
            cuido_data["ave_nombre"] = ave.get("nombre")
            cuido_data["ave_foto"] = ave.get("foto_principal")
            cuido_data["ave_color"] = ave.get("color")
            cuido_data["ave_linea"] = ave.get("linea")

    return cuido_data


@api_router.put("/cuido/{cuido_id}")
async def update_cuido(cuido_id: str, cuido_update: CuidoUpdate, current_user: dict = Depends(get_current_user)):
    existing = await db.cuido.find_one({
        "_id": to_object_id(cuido_id, "cuido_id"),
        "user_id": current_user["id"],
    })
    if not existing:
        raise HTTPException(status_code=404, detail="Cuido no encontrado")

    update_data = {k: v for k, v in cuido_update.dict().items() if v is not None}

    if "trabajos" in update_data:
        update_data["trabajos"] = [t.dict() if hasattr(t, "dict") else t for t in update_data["trabajos"]]

    update_data["updated_at"] = datetime.utcnow()

    await db.cuido.update_one(
        {"_id": to_object_id(cuido_id, "cuido_id")},
        {"$set": update_data},
    )

    updated = await db.cuido.find_one({"_id": to_object_id(cuido_id, "cuido_id")})
    return serialize_doc(updated)


@api_router.post("/cuido/{cuido_id}/tope")
async def registrar_tope(
    cuido_id: str,
    tope_numero: int,
    notas: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    if tope_numero not in [1, 2]:
        raise HTTPException(status_code=400, detail="Tope debe ser 1 o 2")

    cuido = await db.cuido.find_one({
        "_id": to_object_id(cuido_id, "cuido_id"),
        "user_id": current_user["id"],
    })
    if not cuido:
        raise HTTPException(status_code=404, detail="Cuido no encontrado")

    field_completado = f"tope{tope_numero}_completado"
    field_fecha = f"tope{tope_numero}_fecha"
    field_notas = f"tope{tope_numero}_notas"

    await db.cuido.update_one(
        {"_id": to_object_id(cuido_id, "cuido_id")},
        {"$set": {
            field_completado: True,
            field_fecha: datetime.utcnow().strftime("%Y-%m-%d"),
            field_notas: notas,
            "updated_at": datetime.utcnow(),
        }},
    )

    return {"message": f"Tope {tope_numero} registrado"}


@api_router.post("/cuido/{cuido_id}/trabajo")
async def registrar_trabajo(
    cuido_id: str,
    trabajo_numero: int,
    tiempo_minutos: int,
    notas: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    if trabajo_numero < 1 or trabajo_numero > 5:
        raise HTTPException(status_code=400, detail="Trabajo debe ser entre 1 y 5")

    cuido = await db.cuido.find_one({
        "_id": to_object_id(cuido_id, "cuido_id"),
        "user_id": current_user["id"],
    })
    if not cuido:
        raise HTTPException(status_code=404, detail="Cuido no encontrado")

    trabajos = cuido.get("trabajos", [])
    for t in trabajos:
        if t["numero"] == trabajo_numero:
            t["tiempo_minutos"] = tiempo_minutos
            t["completado"] = True
            t["fecha_completado"] = datetime.utcnow().strftime("%Y-%m-%d")
            t["notas"] = notas
            break

    await db.cuido.update_one(
        {"_id": to_object_id(cuido_id, "cuido_id")},
        {"$set": {"trabajos": trabajos, "updated_at": datetime.utcnow()}},
    )

    return {"message": f"Trabajo {trabajo_numero} registrado con {tiempo_minutos} minutos"}


@api_router.post("/cuido/{cuido_id}/descanso")
async def iniciar_descanso(cuido_id: str, dias: int, current_user: dict = Depends(get_current_user)):
    if dias < 1 or dias > 20:
        raise HTTPException(status_code=400, detail="Días de descanso debe ser entre 1 y 20")

    cuido = await db.cuido.find_one({
        "_id": to_object_id(cuido_id, "cuido_id"),
        "user_id": current_user["id"],
    })
    if not cuido:
        raise HTTPException(status_code=404, detail="Cuido no encontrado")

    fecha_inicio = datetime.utcnow()
    fecha_fin = fecha_inicio + timedelta(days=dias)

    await db.cuido.update_one(
        {"_id": to_object_id(cuido_id, "cuido_id")},
        {"$set": {
            "en_descanso": True,
            "dias_descanso": dias,
            "fecha_inicio_descanso": fecha_inicio.strftime("%Y-%m-%d"),
            "fecha_fin_descanso": fecha_fin.strftime("%Y-%m-%d"),
            "estado": "descanso",
            "updated_at": datetime.utcnow(),
        }},
    )

    return {
        "message": f"Descanso de {dias} días iniciado",
        "fecha_fin": fecha_fin.strftime("%Y-%m-%d"),
    }


@api_router.post("/cuido/{cuido_id}/finalizar-descanso")
async def finalizar_descanso(cuido_id: str, current_user: dict = Depends(get_current_user)):
    cuido = await db.cuido.find_one({
        "_id": to_object_id(cuido_id, "cuido_id"),
        "user_id": current_user["id"],
    })
    if not cuido:
        raise HTTPException(status_code=404, detail="Cuido no encontrado")

    await db.cuido.update_one(
        {"_id": to_object_id(cuido_id, "cuido_id")},
        {"$set": {
            "en_descanso": False,
            "estado": "activo",
            "updated_at": datetime.utcnow(),
        }},
    )

    return {"message": "Descanso finalizado, gallo vuelve a cuido activo"}


@api_router.post("/cuido/{cuido_id}/finalizar")
async def finalizar_cuido(cuido_id: str, current_user: dict = Depends(get_current_user)):
    cuido = await db.cuido.find_one({
        "_id": to_object_id(cuido_id, "cuido_id"),
        "user_id": current_user["id"],
    })
    if not cuido:
        raise HTTPException(status_code=404, detail="Cuido no encontrado")

    await db.cuido.update_one(
        {"_id": to_object_id(cuido_id, "cuido_id")},
        {"$set": {
            "estado": "finalizado",
            "en_descanso": False,
            "updated_at": datetime.utcnow(),
        }},
    )

    return {"message": "Cuido finalizado"}


@api_router.delete("/cuido/{cuido_id}")
async def delete_cuido(cuido_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.cuido.delete_one({
        "_id": to_object_id(cuido_id, "cuido_id"),
        "user_id": current_user["id"],
    })
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
        "fecha_nacimiento": None,
    })

    recent_peleas = await db.peleas.find({"user_id": user_id}).sort("fecha", -1).limit(5).to_list(5)
    peleas_data = []
    for p in recent_peleas:
        ave = None
        ave_id = p.get("ave_id")
        if ave_id:
            try:
                ave = await db.aves.find_one({"_id": to_object_id(ave_id, "ave_id")})
            except HTTPException:
                ave = None

        peleas_data.append({
            "id": str(p["_id"]),
            "fecha": p.get("fecha"),
            "resultado": p.get("resultado"),
            "calificacion": p.get("calificacion"),
            "ave_codigo": ave.get("codigo") if ave else None,
            "ave_nombre": ave.get("nombre") if ave else None,
        })

    total_peleas = await db.peleas.count_documents({"user_id": user_id})
    peleas_ganadas = await db.peleas.count_documents({"user_id": user_id, "resultado": "GANO"})

    today = datetime.utcnow().strftime("%Y-%m-%d")
    week_later = (datetime.utcnow() + timedelta(days=7)).strftime("%Y-%m-%d")
    recordatorios = await db.salud.count_documents({
        "user_id": user_id,
        "proxima_fecha": {"$gte": today, "$lte": week_later},
    })

    return {
        "aves": {
            "total_activas": aves_activas,
            "gallos": gallos,
            "gallinas": gallinas,
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
            "recientes": peleas_data,
        },
        "recordatorios_salud": recordatorios,
    }


# ============== SYNC ==============

@api_router.post("/sync/upload")
async def sync_upload(data: SyncData, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    results = {"aves": 0, "cruces": 0, "camadas": 0, "peleas": 0, "salud": 0}

    for ave in data.aves:
        ave["user_id"] = user_id
        ave["updated_at"] = datetime.utcnow()
        if "id" in ave and ave["id"]:
            try:
                await db.aves.update_one(
                    {"_id": to_object_id(ave["id"], "ave_id"), "user_id": user_id},
                    {"$set": {k: v for k, v in ave.items() if k != "id"}},
                    upsert=True,
                )
            except Exception:
                ave.pop("id", None)
                await db.aves.insert_one(ave)
        else:
            ave.pop("id", None)
            await db.aves.insert_one(ave)
        results["aves"] += 1

    for cruce in data.cruces:
        cruce["user_id"] = user_id
        cruce["updated_at"] = datetime.utcnow()
        if "id" in cruce and cruce["id"]:
            try:
                await db.cruces.update_one(
                    {"_id": to_object_id(cruce["id"], "cruce_id"), "user_id": user_id},
                    {"$set": {k: v for k, v in cruce.items() if k != "id"}},
                    upsert=True,
                )
            except Exception:
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
        except Exception:
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
        "sync_time": datetime.utcnow().isoformat(),
    }


# ============== HEALTH CHECK ==============

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()