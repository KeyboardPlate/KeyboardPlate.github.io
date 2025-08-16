import Decimal from "decimal.js";
export class Key {
    constructor(x, y, width, height, width2, height2, angle, rotx, roty, independentSwitchAngle, stabilizerAngle, shift6UStabilizers, skipOrientationFix) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.width2 = width2;
        this.height2 = height2;
        this.angle = angle;
        this.rotx = rotx;
        this.roty = roty
        this.stabilizerAngle = stabilizerAngle
        this.shift6UStabilizers = shift6UStabilizers
        this.independentSwitchAngle = independentSwitchAngle
        this.skipOrientationFix = skipOrientationFix
        this.centerX = this.x.plus(this.width.dividedBy(new Decimal(2)))
        this.centerY = this.y.plus(this.height.dividedBy(new Decimal(2)))
        let cos = null
        let sin = null
        if (!this.angle.equals(0)) {
            cos = this.angle.dividedBy(new Decimal(180)).times(Decimal.acos(-1)).cos()
            sin = this.angle.dividedBy(new Decimal(180)).times(Decimal.acos(-1)).sin()
            const translatedX = this.centerX.minus(this.rotx);
            const translatedY = this.centerY.minus(this.roty);
            this.centerX = translatedX.times(cos).minus(translatedY.times(sin)).plus(this.rotx)
            this.centerY = translatedX.times(sin).plus(translatedY.times(cos)).plus(this.roty)
        }
    }
}