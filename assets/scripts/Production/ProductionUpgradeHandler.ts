import { _decorator, Component, Node, Label, ToggleContainer } from "cc";
const { ccclass, property } = _decorator;

@ccclass("ProductionUpgradeHandler")
export class ProductionUpgradeHandler extends Component {
    @property
    public modeString: string = "";
    @property
    public mode: number = 0;

    @property(Array<Label>)
    public labelGroup: Array<Label> = [];

    start() {
        this.updatePurchaseMode(0);
    }

    update(deltaTime: number) {
        // find the mode toggle container
        const toggleContainer = this.node
            .getChildByPath("Production/BuyAmountToggle")
            ?.getComponent(ToggleContainer);
        if (toggleContainer) {
            for (let i = 0; i < toggleContainer.toggleItems.length; i++) {
                const toggle = toggleContainer.toggleItems[i];
                if (toggle.isChecked && i != this.mode) {
                    // i is the current mode and does not match the former tick mode
                    this.updatePurchaseMode(i);
                }
            }
        }
    }

    updatePurchaseMode(newMode: number) {
        const modeNames = ["Buy 1", "Buy 10", "Buy MAX"];
        this.modeString = modeNames[newMode];
        this.mode = newMode;
        for (var i in this.labelGroup) {
            this.labelGroup[i].string = this.modeString;
        }
    }

    addLabel(label: Label) {
        this.labelGroup.push(label);
        label.string = this.modeString;
    }
}
