import { _decorator, Component, Node, RichText } from "cc";
const { ccclass, property } = _decorator;

import Decimal from "./lib/break_eternity.ts";
import { floatFormat, integerFormat } from "./lib/break_eternity_formatting.ts";

@ccclass("Player")
export class Player extends Component {
    @property(RichText)
    public toadCountText: RichText | null = null;

    public toadCount: Decimal = new Decimal(0);

    start() {}

    update(deltaTime: number) {
        this.updateDisplay();
    }

    addToad(increment: Decimal | number) {
        this.toadCount = this.toadCount.plus(increment);
    }

    getToad(): Decimal {
        return this.toadCount.plus(0);
    }

    private updateDisplay() {
        if (this.toadCountText) {
            this.toadCountText.string = floatFormat(this.toadCount);
        }
    }

    public canAfford(toad: Decimal): boolean {
        return this.toadCount.gte(toad);
    }
}
