// expo 54 + jest-expo 55 compatibility fix:
// expo/src/winter/runtime.native.ts installs lazy polyfills via Object.defineProperty.
// When the lazy getter fires during test execution, require() calls fail due to
// jest's sandbox restriction. Fix: override the lazy getters with concrete values
// after expo setup runs (this file is listed after jest-expo's setup in setupFiles).

const overrides = {
  __ExpoImportMetaRegistry: {},
  structuredClone: (val) => JSON.parse(JSON.stringify(val)),
};

for (const [key, value] of Object.entries(overrides)) {
  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
    enumerable: true,
  });
}
