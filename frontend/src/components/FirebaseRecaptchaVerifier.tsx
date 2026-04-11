/**
 * FirebaseRecaptchaVerifier.tsx
 *
 * Custom invisible reCAPTCHA verifier using react-native-webview only.
 * No native Firebase dependencies — only react-native-webview.
 *
 * Implements both the public ApplicationVerifier interface from firebase/auth:
 *   { type: string; verify(): Promise<string> }
 * AND the internal ApplicationVerifierInternal interface that Firebase
 * calls unconditionally in its finally block after signInWithPhoneNumber:
 *   { _reset(): void }
 *
 * Without _reset(), Firebase throws:
 *   "verifier._reset is not a function (it is undefined)"
 *
 * Architecture:
 *   1. An invisible WebView loads Firebase JS SDK v8 from CDN and mounts an
 *      invisible RecaptchaVerifier bound to the authDomain of the project.
 *   2. signInWithPhoneNumber calls verify() → we inject JS to trigger the
 *      reCAPTCHA inside the WebView → token comes back via postMessage.
 *   3. signInWithPhoneNumber then calls _reset() → we inject JS to clear and
 *      reinitialize the RecaptchaVerifier so it's ready for the next call.
 */

import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export interface FirebaseRecaptchaVerifierRef {
  /** Always 'recaptcha' — required by ApplicationVerifier interface. */
  readonly type: string;
  /** Triggers the invisible reCAPTCHA and resolves with the token. */
  verify(): Promise<string>;
  /**
   * Called by Firebase JS SDK internally after signInWithPhoneNumber
   * (in a finally block). Must exist or Firebase throws a TypeError.
   * Resets the verifier so it can be reused (e.g. for resend).
   */
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
  /** Disable real verification for testing only. */
  appVerificationDisabledForTesting?: boolean;
}

const FirebaseRecaptchaVerifier = forwardRef<FirebaseRecaptchaVerifierRef, Props>(
  ({ firebaseConfig, appVerificationDisabledForTesting = false }, ref) => {
    const webviewRef = useRef<WebView>(null);
    const pendingResolve = useRef<((token: string) => void) | null>(null);
    const pendingReject = useRef<((err: Error) => void) | null>(null);

    // JS to reinitialize the RecaptchaVerifier inside the WebView.
    // Called both on page load and from _reset() so the verifier is always fresh.
    const RESET_SCRIPT = `
      (function() {
        if (typeof window.initRecaptcha === 'function') {
          window.initRecaptcha();
        }
      })();
      true;
    `;

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

      /**
       * Firebase calls this unconditionally in its internal finally block.
       * We clear the pending callbacks and reinitialize the RecaptchaVerifier
       * so it's ready for the next call (e.g. resend OTP).
       */
      _reset(): void {
        pendingResolve.current = null;
        pendingReject.current = null;
        webviewRef.current?.injectJavaScript(RESET_SCRIPT);
      },
    }));

    // The WebView content. Uses Firebase JS SDK v8 compat (CDN) to create an
    // invisible RecaptchaVerifier. window.initRecaptcha() is exposed globally
    // so _reset() can call it again via injectJavaScript.
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <script src="https://www.gstatic.com/firebasejs/8.0.0/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.0.0/firebase-auth.js"></script>
  <script>
    firebase.initializeApp(${JSON.stringify(firebaseConfig)});

    window.initRecaptcha = function() {
      // Clear the previous verifier if it exists
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch(e) {}
        window.recaptchaVerifier = null;
      }

      // Clear the DOM container so RecaptchaVerifier can inject fresh markup
      var container = document.getElementById('recaptcha-container');
      if (container) { container.innerHTML = ''; }

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
    };

    function onPageLoad() {
      window.initRecaptcha();
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
          // 'load' — verifier is ready, nothing to do
        }
      } catch {
        // JSON parse error, ignore
      }
    };

    return (
      // Zero dimensions: completely invisible to the user
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
