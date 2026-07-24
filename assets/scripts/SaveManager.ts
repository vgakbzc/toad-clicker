import { _decorator, Component, Node, sys } from "cc";
import { SaveData, SaveDataManager } from "./SaveData";
import { instanceToPlain, plainToInstance } from "class-transformer";
const { ccclass } = _decorator;

const SAVE_KEY = "toad_clicker_save";
const AUTO_SAVE_INTERVAL = 30;

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
        sys.localStorage.setItem(SAVE_KEY, SaveData.serialize());
        console.log("[SaveManager] Saved", SaveData.serialize());
    }

    load(): void {
        const raw = sys.localStorage.getItem(SAVE_KEY);
        if (!raw) {
            console.log("[SaveManager] No save found");
            return;
        }
        SaveData.merge(SaveDataManager.deserialize(raw));
    }

    resetSave(): void {
        sys.localStorage.removeItem(SAVE_KEY);
        console.log("[SaveManager] Save reset");
    }

    private scheduleAutoSave(): void {
        if (typeof window !== "undefined") {
            window.addEventListener("beforeunload", () => this.save());
        }
    }
}
