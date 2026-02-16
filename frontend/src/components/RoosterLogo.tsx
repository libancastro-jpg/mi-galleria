import React from 'react';
import { View, Image } from 'react-native';
import { SvgXml } from 'react-native-svg';

/**
 * Logo del Gallo - Imagen decorativa
 * NO ES UN ICONO DEL SISTEMA
 * SVG fijo, no modificar el path
 */

// SVG exacto como string - NO MODIFICAR
const ROOSTER_SVG = `<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 512 512"
     preserveAspectRatio="xMidYMid meet">
  <path fill="#F5A623" d="
    M169 120
    C145 132 132 154 131 176
    C130 200 140 220 156 234
    C126 248 110 270 110 297
    C110 333 136 360 175 367
    C206 372 237 364 260 347
    C271 368 287 389 308 405
    C340 430 381 444 427 446
    C436 446 444 439 444 430
    C444 421 436 414 427 414
    C396 413 368 405 345 391
    C363 388 382 379 401 364
    C408 358 410 348 404 341
    C399 334 388 332 381 338
    C360 352 339 359 319 359
    C315 359 311 359 307 358
    C316 350 322 340 326 330
    C348 338 372 336 395 324
    C403 320 406 310 402 302
    C398 294 388 291 380 295
    C360 305 341 305 325 297
    C327 286 327 274 325 262
    C355 255 377 239 389 215
    C395 203 399 190 401 176
    C415 173 426 166 433 156
    C439 148 441 139 439 131
    C437 123 431 118 424 116
    C416 114 407 117 399 123
    C391 108 379 96 365 88
    C349 80 332 78 316 81
    C306 62 287 49 264 46
    C240 43 214 52 199 72
    C186 69 175 73 169 80
    C163 87 163 96 169 103
    C174 109 182 112 190 114
    C183 117 176 119 169 120
    Z
    M225 102
    C238 92 257 90 273 95
    C288 99 299 110 303 124
    C305 131 312 136 320 135
    C333 133 346 135 357 141
    C370 149 379 163 380 178
    C381 186 379 195 375 203
    C366 220 347 232 320 236
    C311 237 305 245 307 254
    C310 269 309 284 304 297
    C296 316 280 333 257 345
    C235 356 208 360 184 354
    C161 348 144 328 144 305
    C144 283 160 266 189 258
    C200 255 202 240 193 235
    C173 223 164 203 165 182
    C167 163 180 145 204 136
    C211 133 216 126 214 118
    C212 111 215 106 225 102
    Z
    M205 368
    C198 386 196 400 196 414
    C196 423 189 430 180 430
    C171 430 164 423 164 414
    C164 395 169 375 179 356
    C183 348 193 345 201 349
    C209 353 212 361 205 368
    Z
    M240 360
    C234 378 232 395 232 414
    C232 423 225 430 216 430
    C207 430 200 423 200 414
    C200 393 204 372 213 351
    C216 343 226 339 234 343
    C242 347 246 354 240 360
    Z
  "/>
</svg>`;

interface RoosterLogoProps {
  size?: number;
}

/**
 * Componente de Logo del Gallo
 * Renderiza como imagen estática en contenedor cuadrado
 * Modo contain, sin stretch
 */
export function RoosterLogo({ size = 64 }: RoosterLogoProps) {
  return (
    <View style={{
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <SvgXml
        xml={ROOSTER_SVG}
        width={size}
        height={size}
      />
    </View>
  );
}

export default RoosterLogo;
