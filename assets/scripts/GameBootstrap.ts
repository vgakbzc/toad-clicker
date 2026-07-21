import "reflect-metadata";

import { _decorator, Component, Node } from "cc";
const { ccclass, property } = _decorator;

@ccclass("GameBootstrap")
export class GameBootstrap extends Component {
    onLoad() {
        // Ready to use class-transformer safely across the game
    }
}
