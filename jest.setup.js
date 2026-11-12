import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    push: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

class IntersectionObserverMock {
  constructor(callback) {
    this.callback = callback;
  }

  disconnect() {}

  observe(element) {
    this.callback(
      [
        {
          boundingClientRect: element.getBoundingClientRect(),
          intersectionRatio: 1,
          intersectionRect: element.getBoundingClientRect(),
          isIntersecting: true,
          rootBounds: null,
          target: element,
          time: Date.now(),
        },
      ],
      this
    );
  }

  takeRecords() {
    return [];
  }

  unobserve() {}
}

Object.defineProperty(window, 'IntersectionObserver', {
  configurable: true,
  value: IntersectionObserverMock,
});

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: (query) => ({
    addEventListener: jest.fn(),
    addListener: jest.fn(),
    dispatchEvent: jest.fn(),
    matches: false,
    media: query,
    onchange: null,
    removeEventListener: jest.fn(),
    removeListener: jest.fn(),
  }),
});

Object.defineProperty(window, 'scrollTo', {
  configurable: true,
  value: jest.fn(),
});

Object.defineProperty(Element.prototype, 'scrollIntoView', {
  configurable: true,
  value: jest.fn(),
});

Object.defineProperty(navigator, 'clipboard', {
  configurable: true,
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});
