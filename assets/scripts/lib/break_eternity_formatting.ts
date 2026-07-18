import { Decimal } from "./break_eternity.ts";

export function integerFormat(num: Decimal): string {
    if (num.lt(100000)) {
        return num.toFixed(0);
    } else {
        return num.toExponential(3);
    }
}
