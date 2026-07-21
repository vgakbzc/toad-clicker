import { _decorator, Component, Node } from "cc";
import { ProductionComponentBase } from "./ProductionComponentBase";
import { Decimal } from "../lib/break_eternity";
const { ccclass, property } = _decorator;

@ccclass("ProductionComponentGrannyToad")
export class ProductionComponentGrannyToad extends ProductionComponentBase {
    override costCubicScaling: Decimal = new Decimal(0.08);
    override costExponentialScaling: Decimal = new Decimal(1);
    override costExponentialGate: Decimal = new Decimal(10);
    override costExponentialBase: Decimal = new Decimal(1.08);
    override costLinearScaling: Decimal = new Decimal(325);
    // accumulated cost = linear *[n + cubic*(n-1)^3 + exponent*base^(n-gate)]

    override baseProduction = new Decimal(7.99);

    start() {
        super.start();
    }

    update(deltaTime: number) {
        super.update(deltaTime);
    }
}
