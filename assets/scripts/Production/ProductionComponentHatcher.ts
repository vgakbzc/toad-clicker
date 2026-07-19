import { _decorator, Component, Node } from "cc";
import { ProductionComponentBase } from "./ProductionComponentBase";
import { Decimal } from "../lib/break_eternity";
const { ccclass, property } = _decorator;

@ccclass("ProductionComponentHatcher")
export class ProductionComponentHatcher extends ProductionComponentBase {
    override baseProduction = new Decimal(0.5);

    start() {
        super.start();
    }

    update(deltaTime: number) {
        super.update(deltaTime);
    }
}
