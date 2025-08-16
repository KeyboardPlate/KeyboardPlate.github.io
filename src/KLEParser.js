import Decimal from "decimal.js";
import json5 from "json5";
import { Key } from './Key'

export function parseKle(kleText) {

    let kleData = null

    try {
        kleData = json5.parse(kleText)
    } catch (error) {
        try {
            kleData = json5.parse('[' + kleText + ']')
        } catch (error) {
            return null
        }
    }

    let keys = [];
    let currX = new Decimal(0);
    let currY = new Decimal(0);
    let currAngle = new Decimal(0);
    let currRotX = new Decimal(0);
    let currRotY = new Decimal(0);
    let clusterX = new Decimal(0);
    let clusterY = new Decimal(0);

    let decal = false;
    let width = new Decimal(1);
    let height = new Decimal(1);
    let width2 = null;
    let height2 = null;

    let stabilizerAngle = new Decimal(0)
    let independentSwitchAngle = new Decimal(0)
    let shift6UStabilizers = false
    let skipOrientationFix = false

    try {

        for (const row of kleData) {

            for (const element of row) {

                if (typeof element === 'string') {
                    if (decal) {
                        decal = false
                    }
                    else {
                        let newKey = new Key(
                            currX, currY,
                            width, height,
                            width2, height2,
                            currAngle,
                            currRotX, currRotY,
                            independentSwitchAngle,
                            stabilizerAngle,
                            shift6UStabilizers,
                            skipOrientationFix
                        )
                        keys.push(newKey)
                    }
                    currX = currX.plus(width)
                    width = new Decimal(1)
                    height = new Decimal(1)
                    width2 = null
                    height2 = null
                    independentSwitchAngle = new Decimal(0)
                    stabilizerAngle = new Decimal(0)
                    shift6UStabilizers = false
                    skipOrientationFix = false
                    
                }

                else if (element === Object(element)) {

                    if (element.hasOwnProperty('r')) {
                        currAngle = new Decimal(element.r)
                    }
                    if (element.hasOwnProperty('rx')) {
                        currRotX = new Decimal(element.rx)
                        clusterX = new Decimal(element.rx)
                        currX = clusterX
                        currY = clusterY
                    }
                    if (element.hasOwnProperty('ry')) {
                        currRotY = new Decimal(element.ry)
                        clusterY = new Decimal(element.ry)
                        currX = clusterX
                        currY = clusterY
                    }

                    if (element.hasOwnProperty('d')) {
                        decal = element.d
                    }
                    if (element.hasOwnProperty('w')) {
                        width = new Decimal(element.w)
                    }
                    if (element.hasOwnProperty('h')) {
                        height = new Decimal(element.h)
                    }
                    if (element.hasOwnProperty('w2')) {
                        width2 = new Decimal(element.w2)
                    }
                    if (element.hasOwnProperty('h2')) {
                        height2 = new Decimal(element.h2)
                    }
                    
                    if (element.hasOwnProperty('_rs')) {
                        stabilizerAngle = new Decimal(element._rs)
                    }
                    if (element.hasOwnProperty('_rc')) {
                        independentSwitchAngle = new Decimal(element._rc)
                    }
                    if (element.hasOwnProperty('_ss')) {
                        shift6UStabilizers = element._ss
                    }
                    if (element.hasOwnProperty('_so')) {
                        skipOrientationFix = element._so
                    }

                    if (element.hasOwnProperty('x')) {
                        currX = currX.plus(element.x)
                    }
                    if (element.hasOwnProperty('y')) {
                        currY = currY.plus(element.y)
                    }

                }

                else {
                    console.error("发现无效元素")
                    return null
                }

            }

            currX = currRotX
            currY = currY.plus(1)

        }

    } catch (error) {
        console.error(error)
        return null
    }

    return keys

}