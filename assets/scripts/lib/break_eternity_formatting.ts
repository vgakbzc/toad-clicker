import { Decimal } from "./break_eternity.ts";

export function integerFormat(num: Decimal): string {
    if (num.lt(100000)) {
        return num.toFixed(0);
    } else {
        return num.toExponential(3);
    }
}

export function floatFormat(num: Decimal): string {
    if (num.eq(0)) {
        return "0";
    }
    if (num.lt(1000) && num.gt(0.001)) {
        return num.toPrecision(3);
    }
    return num.toExponential(3);
}
