const instances: Record<string, any> = {};

function isString(arg: unknown): arg is string {
  return typeof arg === "string";
}

const createServiceLocator = <T extends Record<string, any>>() => ({
  set<K extends keyof T, V extends T[K]>(instanceId: K, instance: V): void {
    isString;
    if (isString(instanceId)) {
      instances[instanceId] = instance;
    }
  },

  get<K extends keyof T, V extends T[K]>(instanceId: K): V | undefined {
    if (isString(instanceId) && instances[instanceId]) {
      return instances[instanceId];
    }
  },
});

export default createServiceLocator;
