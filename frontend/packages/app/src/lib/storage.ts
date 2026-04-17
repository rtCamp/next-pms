export const setLocalStorage = <T>(key: string, value: T): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const removeLocalStorage = (key: string) => {
  localStorage.removeItem(key);
};

export const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  const value = localStorage.getItem(key);
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
};

export const hasKeyInLocalStorage = (key: string) => {
  return Object.prototype.hasOwnProperty.call(localStorage, key);
};
