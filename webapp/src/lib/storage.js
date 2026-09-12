const STORAGE_KEY = 'julo_web_workspace_v1';

export const emptyWorkspace = () => ({
  version: 1,
  projects: [],
  tasks: [],
  settings: { theme: 'light' },
});

export const localStorageProvider = {
  async load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? { ...emptyWorkspace(), ...JSON.parse(raw) } : emptyWorkspace();
    } catch {
      return emptyWorkspace();
    }
  },
  async save(state) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },
};

let provider = localStorageProvider;
export const setStorageProvider = (nextProvider) => { provider = nextProvider; };
export const loadWorkspace = () => provider.load();
export const saveWorkspace = (state) => provider.save(state);
