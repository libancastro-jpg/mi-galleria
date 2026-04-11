/**
 * FirebaseRecaptchaVerifier.tsx
 *
 * Custom invisible reCAPTCHA verifier using react-native-webview only.
 * No native Firebase dependencies — only react-native-webview.
 *
 * Implements:
 *   - ApplicationVerifier (public Firebase interface): { type, verify() }
 *   - ApplicationVerifierInternal (internal Firebase interface): { _reset() }
 *
 * _reset() strategy: increment a React key to force-unmount and remount the
 * WebView. This is the same approach expo-firebase-recaptcha uses for its
 * invisible verifier (invisibleKey state). It guarantees a clean DOM with no
 * "reCAPTCHA has already been rendered in this element" errors on resend.
 *
 * Firebase calls _reset() automatically in a finally block after every
 * signInWithPhoneNumber call, so by the time the user can click Resend
 * (120 seconds later), the WebView is already fully re-initialized.
 */

import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export interface FirebaseRecaptchaVerifierRef {
  readonly type: string;
  verify(): Promise<string>;
  /** Called by Firebase JS SDK internally after signInWithPhoneNumber. */
  _reset(): void;
}

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  [key: string]: unknown;
}

interface Props {
  firebaseConfig: FirebaseConfig;
  appVerificationDisabledForTesting?: boolean;
}

const FirebaseRecaptchaVerifier = forwardRef<FirebaseRecaptchaVerifierRef, Props>(
  ({ firebaseConfig, appVerificationDisabledForTesting = false }, ref) => {
    const webviewRef = useRef<WebView>(null);
    const pendingResolve = useRef<((token: string) => void) | null>(null);
    const pendingReject = useRef<((err: Error) => void) | null>(null);
    // Incrementing this key unmounts+remounts the WebView with a fresh DOM.
    const [webviewKey, setWebviewKey] = useState(0);

    useImperativeHandle(ref, () => ({
      type: 'recaptcha',

      verify(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
          pendingResolve.current = resolve;
          pendingReject.current = reject;

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

      _reset(): void {
        // Clear any pending promise callbacks
        pendingResolve.current = null;
        pendingReject.current = null;
        // Force WebView remount — gives a completely clean DOM on next verify()
        setWebviewKey(k => k + 1);
      },
    }));

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
            'expired-callback': function() {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({ type: 'expired' })
              );
            },
            'error-callback': function() {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({ type: 'error', message: 'reCAPTCHA widget error' })
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
        switch (data.type) {
          case 'verify':
            if (pendingResolve.current) {
              pendingResolve.current(data.token);
              pendingResolve.current = null;
              pendingReject.current = null;
            }
            break;
          case 'error':
            if (pendingReject.current) {
              pendingReject.current(new Error(data.message ?? 'reCAPTCHA error'));
              pendingResolve.current = null;
              pendingReject.current = null;
            }
            break;
          case 'expired':
            if (pendingReject.current) {
              pendingReject.current(new Error('El reCAPTCHA expiró. Inténtalo de nuevo.'));
              pendingResolve.current = null;
              pendingReject.current = null;
            }
            break;
        }
      } catch {
        // JSON parse error, ignore
      }
    };

    return (
      <View style={{ width: 0, height: 0, overflow: 'hidden' }}>
        <WebView
          key={webviewKey}
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
