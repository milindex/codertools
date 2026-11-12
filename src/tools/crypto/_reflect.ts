/**
 * `@peculiar/x509` depends on tsyringe, which requires a Reflect metadata
 * implementation. `reflect-metadata` is not installed, so install the small
 * subset of the API that tsyringe uses before loading the certificate parser.
 */
type MetadataKey = string | symbol;

type ReflectWithMetadata = typeof Reflect & {
  defineMetadata?: (
    key: MetadataKey,
    value: unknown,
    target: object,
    propertyKey?: MetadataKey
  ) => void;
  getOwnMetadata?: (
    key: MetadataKey,
    target: object,
    propertyKey?: MetadataKey
  ) => unknown;
  getMetadata?: (
    key: MetadataKey,
    target: object,
    propertyKey?: MetadataKey
  ) => unknown;
};

const metadataStore = new WeakMap<object, Map<MetadataKey, unknown>>();

const storeFor = (target: object): Map<MetadataKey, unknown> => {
  let store = metadataStore.get(target);
  if (!store) {
    store = new Map<MetadataKey, unknown>();
    metadataStore.set(target, store);
  }
  return store;
};

export const ensureReflectMetadata = (): void => {
  const reflect = Reflect as ReflectWithMetadata;

  if (
    typeof reflect.defineMetadata === 'function' &&
    typeof reflect.getOwnMetadata === 'function' &&
    typeof reflect.getMetadata === 'function'
  ) {
    return;
  }

  reflect.defineMetadata = (key, value, target) => {
    storeFor(target).set(key, value);
  };

  reflect.getOwnMetadata = (key, target) => metadataStore.get(target)?.get(key);

  reflect.getMetadata = (key, target) => {
    let current: object | null = target;
    while (current) {
      const store = metadataStore.get(current);
      if (store?.has(key)) {
        return store.get(key);
      }
      current = Object.getPrototypeOf(current) as object | null;
    }
    return undefined;
  };
};
