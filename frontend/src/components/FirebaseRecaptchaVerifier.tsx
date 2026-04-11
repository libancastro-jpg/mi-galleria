/**
 * FirebaseRecaptchaVerifier.tsx
 *
 * Custom invisible reCAPTCHA verifier using react-native-webview only.
 * Reemplaza expo-firebase-recaptcha (que arrastraba expo-firebase-core y
 * su podspec nativo Firebase/Core).
 *
 * Implementa la interfaz ApplicationVerifier de firebase/auth:
 *   { type: string; verify(): Promise<string> }
 *
 * La lógica es:
 *  1. Un WebView invisible carga Firebase JS SDK v8 desde CDN y monta un
 *     RecaptchaVerifier invisible atado al dominio authDomain del proyecto.
 *  2. Cuando signInWithPhoneNumber llama a verifier.verify(), este componente
 *     dispara el reCAPTCHA dentro del WebView y devuelve el token.
 *  3. El token viaja de WebView → RN por window.ReactNativeWebView.postMessage.
 *
 * NO tiene ninguna dependencia nativa de Firebase — solo react-native-webview.
 */

import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export interface FirebaseRecaptchaVerifierRef {
  /** Siempre 'recaptcha' — requerido por la interfaz ApplicationVerifier. */
  readonly type: string;
  /** Dispara el reCAPTCHA invisible y devuelve el token. */
  verify(): Promise<string>;
}

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  [key: string]: unknown;
}

interface Props {
  firebaseConfig: FirebaseConfig;
  /** En true deshabilita la verificación real (solo para pruebas). */
  appVerificationDisabledForTesting?: boolean;
}

const FirebaseRecaptchaVerifier = forwardRef<FirebaseRecaptchaVerifierRef, Props>(
  ({ firebaseConfig, appVerificationDisabledForTesting = false }, ref) => {
    const webviewRef = useRef<WebView>(null);
    const pendingResolve = useRef<((token: string) => void) | null>(null);
    const pendingReject = useRef<((err: Error) => void) | null>(null);

    useImperativeHandle(ref, () => ({
      type: 'recaptcha',

      verify(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
          pendingResolve.current = resolve;
          pendingReject.current = reject;

          // Dispara el reCAPTCHA invisible dentro del WebView
          webviewRef.current?.injectJavaScript(`
            (function() {
              if (window.recaptchaVerifier) {
                window.recaptchaVerifier.verify()
                  .then(function(token) {
                    window.ReactNativeWebView.postMessage(
                      JSON.stringify({ type: 'verify', token: token })
                    );
                  })
                  .catch(function(err) {
                    window.ReactNativeWebView.postMessage(
                      JSON.stringify({ type: 'error', message: err.message || 'reCAPTCHA error' })
                    );
                  });
              } else {
                window.ReactNativeWebView.postMessage(
                  JSON.stringify({ type: 'error', message: 'reCAPTCHA verifier not ready' })
                );
              }
            })();
            true;
          `);
        });
      },
    }));

    // HTML inline: carga Firebase JS SDK v8 desde CDN (no nativo),
    // monta el RecaptchaVerifier invisible y notifica cuando está listo.
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <script src="https://www.gstatic.com/firebasejs/8.0.0/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.0.0/firebase-auth.js"></script>
  <script>
    firebase.initializeApp(${JSON.stringify(firebaseConfig)});

    function onPageLoad() {
      try {
        firebase.auth().settings.appVerificationDisabledForTesting = ${appVerificationDisabledForTesting};

        window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(
          'recaptcha-container',
          {
            size: 'invisible',
            callback: function(token) {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({ type: 'verify', token: token })
              );
            },
            'expired-callback': function() {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({ type: 'error', message: 'reCAPTCHA expired' })
              );
            },
            'error-callback': function() {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({ type: 'error', message: 'reCAPTCHA error' })
              );
            }
          }
        );

        window.recaptchaVerifier.render().then(function() {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'load' })
          );
        }).catch(function(err) {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'error', message: err.message || 'render error' })
          );
        });
      } catch(err) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: 'error', message: err.message || 'init error' })
        );
      }
    }
  </script>
</head>
<body onload="onPageLoad()" style="margin:0;padding:0;background:transparent;">
  <div id="recaptcha-container"></div>
</body>
</html>`;

    const handleMessage = (event: { nativeEvent: { data: string } }) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'verify') {
          pendingResolve.current?.(data.token);
          pendingResolve.current = null;
          pendingReject.current = null;
        } else if (data.type === 'error') {
          pendingReject.current?.(new Error(data.message ?? 'reCAPTCHA error'));
          pendingResolve.current = null;
          pendingReject.current = null;
        }
        // 'load' — ignorado, solo indica que el verifier está listo
      } catch {
        // JSON parse error, ignorar
      }
    };

    return (
      // Dimensiones cero: invisible para el usuario
      <View style={{ width: 0, height: 0, overflow: 'hidden' }}>
        <WebView
          ref={webviewRef}
          style={{ width: 1, height: 1 }}
          source={{
            html,
            baseUrl: `https://${firebaseConfig.authDomain}`,
          }}
          javaScriptEnabled
          mixedContentMode="always"
          onMessage={handleMessage}
        />
      </View>
    );
  }
);

FirebaseRecaptchaVerifier.displayName = 'FirebaseRecaptchaVerifier';

export default FirebaseRecaptchaVerifier;
