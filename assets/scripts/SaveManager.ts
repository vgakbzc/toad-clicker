import { _decorator, Component, EditBox, Node, sys } from "cc";
import {
    copyToClipboard,
    DefaultSave,
    SaveData,
    SaveDataManager,
} from "./SaveData";
import { instanceToPlain, plainToInstance } from "class-transformer";
const { ccclass } = _decorator;

const SAVE_KEY = "toad_clicker_save";
const AUTO_SAVE_INTERVAL = 30;
const LOAD_TIMEOUT = 5;
const LOAD_PHASE_REQUIRED = 1;

@ccclass("SaveManager")
export class SaveManager extends Component {
    private timer: number = 0;
    private loadCooldown: number = 0;
    private loadPhase: number = 0;

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
        if (this.loadPhase > 0) {
            this.loadCooldown += dt;
            if (this.loadCooldown >= LOAD_TIMEOUT) {
                this.loadCooldown = 0;
                this.loadPhase = 0;
            }
        }
    }

    save(): void {
        sys.localStorage.setItem(SAVE_KEY, SaveData.serialize());
        console.log("[SaveManager] Saved", SaveData.serialize());
    }

    saveToClipboard(): void {
        let saveString = SaveData.serialize();
        copyToClipboard(saveString);
    }

    load(): void {
        const raw = sys.localStorage.getItem(SAVE_KEY);
        if (!raw) {
            console.log("[SaveManager] No save found");
            return;
        }
        SaveData.merge(SaveDataManager.deserialize(raw));
    }

    loadFromEditbox(): void {
        console.log(
            "[SaveManager] Loading from editbox activated, phase: " +
                this.loadPhase,
        );
        if (this.loadPhase < LOAD_PHASE_REQUIRED) {
            ++this.loadPhase;
        } else {
            this.loadPhase = 0;
            let editbox = this.node
                .getParent()
                ?.getChildByPath("/Canvas/SaveMenu/EditBox")
                ?.getComponent<EditBox>(EditBox);
            let raw = editbox?.string;
            console.log("[SaveManager] Raw Data: ", raw);
            if (raw) {
                SaveData.reset();
                SaveData.merge(SaveDataManager.deserialize(raw));
                if (editbox) {
                    editbox.string = "";
                }
            }
        }
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
