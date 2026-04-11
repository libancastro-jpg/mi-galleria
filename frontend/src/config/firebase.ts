/**
 * firebase.ts
 *
 * Inicialización del Firebase JS SDK.
 * Se usa en toda la app para Phone Auth (OTP) sin código nativo.
 *
 * iOS key: AIzaSyCrmYdvhGg-WCEhf7U58vV8JaH7PlyPi0A
 * Android key: AIzaSyBcLN5WQNILTkZADmWuWABp5MaB2opU00w
 * Usamos la iOS key como apiKey principal del JS SDK.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: 'AIzaSyCrmYdvhGg-WCEhf7U58vV8JaH7PlyPi0A',
  authDomain: 'migalleria-b3fa8.firebaseapp.com',
  projectId: 'migalleria-b3fa8',
  storageBucket: 'migalleria-b3fa8.firebasestorage.app',
  messagingSenderId: '962758236557',
  appId: '1:962758236557:ios:64d2adbc235326bb0545c4',
};

const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const firebaseAuth: Auth = getAuth(app);

export default app;
