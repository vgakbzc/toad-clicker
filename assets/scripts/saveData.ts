import { instanceToPlain, plainToInstance } from "class-transformer";
import { Component, js } from "cc";
import { Decimal } from "./lib/break_eternity";
import { native, sys } from "cc";

/**
 * Copies a text string to the system clipboard across Web, Native, and Mini-Game platforms.
 * @returns A promise resolving to true if successful, false otherwise.
 */
export function copyToClipboard(text: string): Promise<boolean> {
    // 1. Native Platforms (Android, iOS, Windows, Mac builds)
    if (
        sys.isNative &&
        native &&
        typeof native.copyTextToClipboard === "function"
    ) {
        native.copyTextToClipboard(text);
        return Promise.resolve(true);
    }

    // 2. Mini-Games (e.g., WeChat Mini Game)
    const globalWx = (window as any).wx;
    if (globalWx && typeof globalWx.setClipboardData === "function") {
        return new Promise((resolve) => {
            globalWx.setClipboardData({
                data: text,
                success: () => resolve(true),
                fail: () => resolve(false),
            });
        });
    }

    // 3. Modern Web Browsers / Preview Mode
    if (navigator && navigator.clipboard) {
        return navigator.clipboard
            .writeText(text)
            .then(() => true)
            .catch(() => fallbackCopyText(text));
    }

    // 4. Legacy Web Browser fallback
    return Promise.resolve(fallbackCopyText(text));
}

/**
 * Fallback mechanism creating a temporary off-screen textarea for older browsers.
 */
function fallbackCopyText(text: string): boolean {
    try {
        const textArea = document.createElement("textarea");
        textArea.value = text;

        // Safeguard view layout by hiding the element off-screen
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        return successful;
    } catch (err) {
        console.error("[Clipboard] Fallback copy failed:", err);
        return false;
    }
}

const localClassRegistry = {
    get(name: string): new () => any {
        return (this as any)[name];
    },
};
const registryObjectList = [new Decimal(0)];
for (let object of registryObjectList) {
    (localClassRegistry as any)[object.constructor.name] = object.constructor;
}

function toPlain<T extends Object>(value: T): any {
    if (value === null || value === undefined || typeof value !== "object") {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map((item) => toPlain(item));
    }

    // Try finding the class name through Cocos
    let className: string = value.constructor.name;

    if (className && className !== "Object" && className !== "Array") {
        const plainObj: any = { __type__: className };
        for (const key of Object.keys(value)) {
            plainObj[key] = toPlain((value as any)[key]);
        }
        return plainObj;
    }

    const plainObj: any = {};
    for (const key of Object.keys(value)) {
        plainObj[key] = toPlain((value as any)[key]);
    }
    return plainObj;
}

function toInstance(value: any): any {
    if (value === null || value === undefined || typeof value !== "object") {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map((item) => toInstance(item));
    }

    if (value.__type__) {
        // Look up the constructor in our local registry first, then Cocos
        const Cls =
            localClassRegistry.get(value.__type__) ||
            js.getClassByName(value.__type__);

        if (Cls) {
            const instance: any = new Cls();
            for (const key of Object.keys(value)) {
                if (key === "__type__") continue;
                instance[key] = toInstance(value[key]);
            }
            return instance;
        } else {
            // A loud error so you know exactly which class is missing from registration
            console.error(
                `[SaveData] CRITICAL: Class "${value.__type__}" could not be found! Methods were lost.`,
            );
        }
    }

    const obj: any = {};
    for (const key of Object.keys(value)) {
        obj[key] = toInstance(value[key]);
    }
    return obj;
}

let defaultSaveData = new Map<string, any>();

export class SaveDataManager {
    protected saveData = new Map<string, any>();

    public static registerEntry<T>(
        component: Component,
        id: string,
        defaultValue: T,
    ) {
        id =
            component.node.getPathInHierarchy() +
            "/" +
            component.name +
            "/" +
            id;
        if (!defaultSaveData.has(id)) {
            console.log(
                "[SaveData] Registered id " +
                    id +
                    " with value of " +
                    defaultValue,
            );
            defaultSaveData.set(id, defaultValue);
        }
    }

    public getValue(component: Component, id: string): any {
        id =
            component.node.getPathInHierarchy() +
            "/" +
            component.name +
            "/" +
            id;
        if (!this.saveData.get(id)) {
            this.saveData.set(id, defaultSaveData.get(id));
        }
        return this.saveData.get(id);
    }

    public setValue<T>(component: Component, id: string, value: T) {
        id =
            component.node.getPathInHierarchy() +
            "/" +
            component.name +
            "/" +
            id;
        this.saveData.set(id, value);
    }

    public serialize(): string {
        // Convert the map to entries, processing custom objects along the way
        const serializedEntries = Array.from(this.saveData.entries()).map(
            ([key, value]) => {
                return [key, toPlain(value)];
            },
        );
        return JSON.stringify(serializedEntries);
    }

    public static deserialize(dataString: string): SaveDataManager {
        let save = new SaveDataManager();
        const parsedEntries = JSON.parse(dataString) as [string, any][];

        // Reconstruct instances and repopulate the Map
        for (const [key, value] of parsedEntries) {
            save.saveData.set(key, toInstance(value));
        }
        return save;
    }

    public merge(save: SaveDataManager) {
        for (const key of save.saveData.keys()) {
            this.saveData.set(key, save.saveData.get(key));
        }
    }

    public copy(): SaveDataManager {
        let save = new SaveDataManager();
        for (const key of this.saveData.keys()) {
            save.saveData.set(key, this.saveData.get(key));
        }
        return save;
    }

    public reset() {
        this.saveData.clear();
    }
}

export let SaveData: SaveDataManager = new SaveDataManager();
export const DefaultSave: SaveDataManager = new SaveDataManager();
