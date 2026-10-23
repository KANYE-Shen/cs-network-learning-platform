import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'

// jsdom 中缺少的 API polyfill
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

if (!window.scrollTo) {
  Object.defineProperty(window, 'scrollTo', { writable: true, value: () => {} })
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
