import { instanceToPlain, plainToInstance } from "class-transformer";
import { Component, js } from "cc";
import { Decimal } from "./lib/break_eternity";

const localClassRegistry = {
    Decimal: new Decimal(0).constructor,
    get(name: string): new () => any {
        return (this as any)[name];
    },
};

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

export class SaveDataManager {
    protected saveData = new Map<string, any>();

    public registerEntry<T>(component: Component, id: string, defaultValue: T) {
        id =
            component.node.getPathInHierarchy() +
            "/" +
            component.name +
            "/" +
            id;
        if (!this.saveData.has(id)) {
            console.log(
                "[SaveData] Registered id " +
                    id +
                    " with value of " +
                    defaultValue,
            );
            this.saveData.set(id, defaultValue);
        }
    }

    public getValue(component: Component, id: string): any {
        id =
            component.node.getPathInHierarchy() +
            "/" +
            component.name +
            "/" +
            id;
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
}

export let SaveData: SaveDataManager = new SaveDataManager();
