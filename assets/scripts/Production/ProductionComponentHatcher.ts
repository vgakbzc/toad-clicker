import { _decorator, Component, Node } from "cc";
import { ProductionComponentBase } from "./ProductionComponentBase";
const { ccclass, property } = _decorator;

@ccclass("ProductionComponentHatcher")
export class ProductionComponentHatcher extends ProductionComponentBase {
    start() {
        super.start();
    }

    update(deltaTime: number) {
        super.update(deltaTime);
    }
}
