

export const setLocalStorage = (key: string, value: any) => {
    try {
        if (typeof value === "object") {
            localStorage.setItem(key, JSON.stringify(value));
        } else {
            localStorage.setItem(key, value);
        }
        return true;
    } catch (error) {
        return false;
    }
}

export const removeLocalStorage = (key: string) => { 
    localStorage.removeItem(key);
}
export const getLocalStorage = (key: string) => {
    const value = localStorage.getItem(key);
    if (!value) return false
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}

export const hasKeyInLocalStorage = (key: string) => { 
    return Object.prototype.hasOwnProperty.call(localStorage, key);    
}
