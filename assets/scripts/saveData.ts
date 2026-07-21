import { instanceToPlain, plainToInstance } from "class-transformer";

// Store which properties are marked @saveData for each class
const saveDataRegistry = new Map<Function, string[]>();

// Class look-up table
export let ClassRegistry = new Map<string, any>();

/** Mark a property to be automatically saved/loaded by SaveManager */
export function saveData<T extends Object>(
    target: T,
    propertyKey: string,
): void {
    const constructor = target.constructor;
    ClassRegistry.set(constructor.name, constructor);
    if (!saveDataRegistry.has(constructor)) {
        saveDataRegistry.set(constructor, []);
    }
    const list = saveDataRegistry.get(constructor)!;
    if (list.indexOf(propertyKey) === -1) {
        list.push(propertyKey);
    }
}

/** Get property names decorated with @saveData for a component */
export function getSaveDataKeys(component: Object): string[] {
    return saveDataRegistry.get(component.constructor) ?? [];
}

/** Serialize a value for saving. Handles Decimal specially; primitives pass through. */
export function serializeValue<T extends Object>(value: T): string {
    return JSON.stringify({
        className: value.constructor.name,
        value: instanceToPlain(value),
    });
}

/** Deserialize a value on load. Reconstructs Decimal from the serialized form. */
export function deserializeValue(raw: string): any {
    const rawMap = JSON.parse(raw) as Map<string, string>;
    return plainToInstance(
        ClassRegistry.get(rawMap.get("className") ?? ""),
        rawMap.get("value"),
    );
}
