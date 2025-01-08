/**
 * External dependencies.
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export * from "./date"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function deBounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number,
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;

    return (...args: Parameters<T>): void => {
        clearTimeout(timeout);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}