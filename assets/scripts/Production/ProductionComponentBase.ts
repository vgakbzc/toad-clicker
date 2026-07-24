import { _decorator, Component, Node, Label, RichText } from "cc";
import { ProductionUpgradeHandler } from "./ProductionUpgradeHandler";
import { Decimal } from "../lib/break_eternity";
import { floatFormat, integerFormat } from "../lib/break_eternity_formatting";
import { Player } from "../Player";
import { SaveData, SaveDataManager } from "../SaveData";
const { ccclass, property } = _decorator;

@ccclass("ProductionComponent")
export class ProductionComponentBase extends Component {
    protected costCubicScaling: Decimal = new Decimal(0.04);
    protected costExponentialScaling: Decimal = new Decimal(1);
    protected costExponentialGate: Decimal = new Decimal(10);
    protected costExponentialBase: Decimal = new Decimal(1.07);
    protected costLinearScaling: Decimal = new Decimal(10);
    // accumulated cost = linear *[n + cubic*(n-1)^3 + exponent*base^(n-gate)]

    public getLevel(): Decimal {
        return SaveData.getValue(this, "level");
    }
    public setLevel(value: Decimal): void {
        SaveData.setValue(this, "level", value);
    }

    protected baseProduction: Decimal = new Decimal(0);

    // other working components
    protected productionUpgradeHandler!:
        | ProductionUpgradeHandler
        | null
        | undefined;
    protected player!: Player | null | undefined;
    protected statsLabel!: Label | null | undefined;

    public getAccumulatedCost(level: Decimal): Decimal {
        // base cost
        let cost = level;
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
        cost = cost.mul(this.costLinearScaling).ceil();
        return cost;
    }
    public getNextLevelCost(level: Decimal): Decimal {
        return this.getAccumulatedCost(level.add(1)).sub(
            this.getAccumulatedCost(level),
        );
    }

    start() {
        // register level data
        SaveDataManager.registerEntry(this, "level", new Decimal(0));
        // register purchase label to mode updater
        this.productionUpgradeHandler = this.node
            .getParent()
            ?.getParent()
            ?.getParent()
            ?.getComponent(ProductionUpgradeHandler);
        let labelComponent = this.node
            .getChildByPath("/Upgrading/Buttons1/Buy1/Label")
            ?.getComponent<Label>(Label);
        if (labelComponent && this.productionUpgradeHandler) {
            this.productionUpgradeHandler.addLabel(labelComponent);
        }
        // find player
        this.player = this.node
            .getParent()
            ?.getParent()
            ?.getParent()
            ?.getParent()
            ?.getParent()
            ?.getChildByName("Player")
            ?.getComponent<Player>(Player);
        // find stats label
        this.statsLabel = this.node
            .getChildByPath("/Upgrading/Stats")
            ?.getComponent<Label>(Label);
    }

    getAffordableUpgradeLevel(): Decimal {
        // fetch current upgrade mode
        // 0: buy 1, 1: buy 10, 2: buy max
        let upgradeMode = 0;
        if (this.productionUpgradeHandler) {
            upgradeMode = this.productionUpgradeHandler.mode;
        }
        let upgradeLevel = new Decimal(1);
        if (upgradeMode == 0) {
            upgradeLevel = new Decimal(1);
        } else if (upgradeMode == 1) {
            upgradeLevel = new Decimal(10);
        } else {
            // do binary search
            const attemptUpgradeLevel: Array<Decimal> = [
                new Decimal(1),
                new Decimal(2),
                new Decimal(4),
                new Decimal(8),
                new Decimal(16),
                new Decimal(32),
                new Decimal(64),
                new Decimal(128),
                new Decimal(256),
                new Decimal(512),
            ];
            for (let i = attemptUpgradeLevel.length - 1; i >= 0; i--) {
                let newUpgradeLevel = upgradeLevel.add(attemptUpgradeLevel[i]);
                if (
                    this.player?.canAfford(
                        this.getAccumulatedCost(
                            this.getLevel().add(newUpgradeLevel),
                        ).minus(this.getAccumulatedCost(this.getLevel())),
                    )
                ) {
                    upgradeLevel = newUpgradeLevel;
                }
            }
        }
        return upgradeLevel;
    }
    getUpgradeCost(): Decimal {
        return this.getAccumulatedCost(
            this.getLevel().add(this.getAffordableUpgradeLevel()),
        ).minus(this.getAccumulatedCost(this.getLevel()));
    }

    update(deltaTime: number) {
        // calculate target upgrade level
        let upgradeLevel = this.getAffordableUpgradeLevel();
        // calculate price
        let upgradeCost = this.getUpgradeCost();
        // update price text
        let priceComponent = this.node
            .getChildByPath("/Upgrading/Buttons1/CostNum")
            ?.getComponent<RichText>(RichText);
        if (priceComponent) {
            // cant afford -> red
            if (!this.player?.canAfford(upgradeCost)) {
                priceComponent.string =
                    "<color=red>" + integerFormat(upgradeCost) + "</color>";
            } else {
                priceComponent.string =
                    "<color=black>" + integerFormat(upgradeCost) + "</color>";
            }
            priceComponent.string += " [+" + integerFormat(upgradeLevel) + "]";
        }
        // produce toad
        let milestoneMult = this.getLevel().div(10).floor().add(1).pow(0.85);
        let toadPerSecond = this.baseProduction
            .times(this.getLevel())
            .mul(milestoneMult);
        // update stats label
        if (this.statsLabel) {
            let eachProduction: string =
                "Base Production: " +
                floatFormat(this.baseProduction) +
                "/s \n";
            let totalProduction: string =
                "Total Production: " +
                floatFormat(toadPerSecond) +
                "/s [" +
                integerFormat(this.getLevel()) +
                "]\n";
            let milestoneInfo: string =
                "Milestone: Production x" +
                floatFormat(milestoneMult) +
                " [" +
                integerFormat(this.getLevel()) +
                "]";
            this.statsLabel.string =
                eachProduction + totalProduction + milestoneInfo;
        }
        if (this.player) {
            this.player.addToad(toadPerSecond.times(deltaTime));
        }
    }

    public purchase() {
        // calculate target upgrade level
        let upgradeLevel = this.getAffordableUpgradeLevel();
        // calculate price
        let upgradeCost = this.getUpgradeCost();
        if (this.player?.canAfford(upgradeCost)) {
            this.player.addToad(upgradeCost.neg());
            this.setLevel(this.getLevel().add(upgradeLevel));
        }
    }
}
