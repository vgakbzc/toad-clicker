import { _decorator, Component, Node, RichText } from "cc";
const { ccclass, property } = _decorator;

import Decimal from "./lib/break_eternity.ts";
import { floatFormat, integerFormat } from "./lib/break_eternity_formatting.ts";
import { SaveData } from "./SaveData.ts";

@ccclass("Player")
export class Player extends Component {
    @property(RichText)
    public toadCountText: RichText | null = null;

    start() {
        SaveData.registerEntry(this, "toadCount", new Decimal(0));
    }

    update(deltaTime: number) {
        this.updateDisplay();
    }

    addToad(increment: Decimal | number) {
        let toadCount = SaveData.getValue(this, "toadCount");
        SaveData.setValue(this, "toadCount", toadCount.add(increment));
    }

    getToad(): Decimal {
        return SaveData.getValue(this, "toadCount");
    }

    private updateDisplay() {
        if (this.toadCountText) {
            this.toadCountText.string = floatFormat(this.getToad());
        }
    }

    public canAfford(toad: Decimal): boolean {
        return this.getToad().gte(toad);
    }
}
