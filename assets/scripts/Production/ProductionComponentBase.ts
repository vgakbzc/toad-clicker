import { _decorator, Component, Node, Label, RichText } from "cc";
import { ProductionUpgradeHandler } from "./ProductionUpgradeHandler";
import { Decimal } from "../lib/break_eternity";
import { integerFormat } from "../lib/break_eternity_formatting";
const { ccclass, property } = _decorator;

@ccclass("ProductionComponent")
export class ProductionComponentBase extends Component {
    private costCubicScaling: Decimal = new Decimal(1);
    private costExponentialScaling: Decimal = new Decimal(1);
    private costExponentialGate: Decimal = new Decimal(10);
    private costExponentialBase: Decimal = new Decimal(1.07);
    private costLinearScaling: Decimal = new Decimal(10);

    private level: Decimal = new Decimal(0);

    public getAccumulatedCost(level: Decimal): Decimal {
        // base cost
        let cost = this.costLinearScaling.mul(level);
        // cubic scaling starting from level 2
        if (level.gte(2)) {
            cost = cost.add(this.costCubicScaling.mul(level.minus(1).pow(3)));
        }
        // exponential starting from gate
        if (level.gte(this.costExponentialGate)) {
            cost = cost.add(
                this.costExponentialScaling.mul(
                    this.costExponentialBase.pow(
                        level.minus(this.costExponentialGate),
                    ),
                ),
            );
        }
        return cost;
    }
    public getNextLevelCost(level: Decimal): Decimal {
        return this.getAccumulatedCost(level.add(1)).sub(
            this.getAccumulatedCost(level),
        );
    }

    start() {
        // register purchase label to mode updater
        let productionUpgradeHandler = this.node
            .getParent()
            ?.getParent()
            ?.getParent()
            ?.getComponent(ProductionUpgradeHandler);
        let labelComponent = this.node
            .getChildByPath("/Upgrading/Buttons1/Buy1/Label")
            ?.getComponent<Label>(Label);
        if (labelComponent && productionUpgradeHandler) {
            productionUpgradeHandler.addLabel(labelComponent);
        }
    }

    update(deltaTime: number) {
        // update price text
        let priceComponent = this.node
            .getChildByPath("/Upgrading/Buttons1/CostNum")
            ?.getComponent<RichText>(RichText);
        console.log(priceComponent);
        if (priceComponent) {
            priceComponent.string = integerFormat(
                this.getNextLevelCost(this.level),
            );
        }
    }
}
