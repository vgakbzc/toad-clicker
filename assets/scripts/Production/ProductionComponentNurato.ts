import { _decorator, Component, Node } from "cc";
import { ProductionComponentBase } from "./ProductionComponentBase";
import { Decimal } from "../lib/break_eternity";
const { ccclass, property } = _decorator;

@ccclass("ProductionComponentNurato")
export class ProductionComponentNurato extends ProductionComponentBase {
    override costCubicScaling: Decimal = new Decimal(0.11);
    override costExponentialScaling: Decimal = new Decimal(1);
    override costExponentialGate: Decimal = new Decimal(10);
    override costExponentialBase: Decimal = new Decimal(1.08);
    override costLinearScaling: Decimal = new Decimal(6250);
    // accumulated cost = linear *[n + cubic*(n-1)^3 + exponent*base^(n-gate)]

    override baseProduction = new Decimal(30);

    start() {
        super.start();
    }

    update(deltaTime: number) {
        super.update(deltaTime);
    }
}
