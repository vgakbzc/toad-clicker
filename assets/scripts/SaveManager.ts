import { _decorator, Component, Node, sys } from "cc";
import {
    getSaveDataKeys,
    serializeValue,
    deserializeValue,
    ClassRegistry,
} from "./saveData";
const { ccclass } = _decorator;

const SAVE_KEY = "toad_clicker_save";
const AUTO_SAVE_INTERVAL = 30;

interface SaveEntry {
    node: string; // node path from scene root for identification
    component: string; // component class name
    data: Record<string, any>;
}

@ccclass("SaveManager")
export class SaveManager extends Component {
    private timer: number = 0;

    start() {
        this.load();
        this.scheduleAutoSave();
    }

    update(dt: number) {
        this.timer += dt;
        if (this.timer >= AUTO_SAVE_INTERVAL) {
            this.timer = 0;
            this.save();
        }
    }

    save(): void {
        const root = this.node.parent!;
        const entries: SaveEntry[] = [];

        this.collect(root, "", entries);

        sys.localStorage.setItem(SAVE_KEY, JSON.stringify(entries));
        console.log("[SaveManager] Saved", entries.length, "components");
    }

    load(): void {
        const raw = sys.localStorage.getItem(SAVE_KEY);
        if (!raw) {
            console.log("[SaveManager] No save found");
            return;
        }

        try {
            const entries: SaveEntry[] = JSON.parse(raw);
            const root = this.node.parent!;

            for (const entry of entries) {
                const target = root.getChildByPath(entry.node);
                if (!target) {
                    console.warn("[SaveManager] Missing node:", entry.node);
                    continue;
                }
                const comp = target.getComponent(
                    ClassRegistry.get(entry.component),
                );
                if (!comp) {
                    console.warn(
                        "[SaveManager] Missing component:",
                        entry.component,
                        "on",
                        entry.node,
                    );
                    continue;
                }
                for (const key of Object.keys(entry.data)) {
                    (comp as any)[key] = deserializeValue(entry.data[key]);
                }
            }
            console.log("[SaveManager] Loaded", entries.length, "components");
        } catch (e) {
            console.warn("[SaveManager] Corrupted save, starting fresh", e);
            sys.localStorage.removeItem(SAVE_KEY);
        }
    }

    resetSave(): void {
        sys.localStorage.removeItem(SAVE_KEY);
        console.log("[SaveManager] Save reset");
    }

    /** Walk the scene tree and collect @saveData properties from every component */
    private collect(node: Node, path: string, out: SaveEntry[]): void {
        const currentPath = path ? path + "/" + node.name : node.name;

        for (const comp of node.components) {
            if (comp === this) continue; // skip SaveManager itself

            const keys = getSaveDataKeys(comp);
            if (keys.length === 0) continue;

            const data: Record<string, any> = {};
            for (const key of keys) {
                data[key] = serializeValue((comp as any)[key]);
            }

            out.push({
                node: currentPath,
                component: comp.constructor.name,
                data,
            });
        }

        for (const child of node.children) {
            this.collect(child, currentPath, out);
        }
    }

    private scheduleAutoSave(): void {
        if (typeof window !== "undefined") {
            window.addEventListener("beforeunload", () => this.save());
        }
    }
}
