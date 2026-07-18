import { _decorator, Component, Node } from "cc";
import { Player } from "./Player.ts";
const { ccclass, property } = _decorator;

@ccclass("ButtonHandler")
export class ButtonHandler extends Component {
    @property(Node)
    public playerNode: Node | null = null;

    start() {}

    update(deltaTime: number) {}

    onToadButtonClick() {
        let player = this.playerNode?.getComponent<Player>(Player);
        if (player) {
            player.addToad(1);
        }
    }
}
