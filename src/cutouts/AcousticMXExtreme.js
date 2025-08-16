import Decimal from 'decimal.js'
import makerjs from 'makerjs'
import { CutoutGenerator } from './CutoutGenerator'

// Extreme MX acoustic cutout

export class AcousticMXExtreme extends CutoutGenerator {

    generate(key, generatorOptions) {

        let keySize = key.width

        if (!key.skipOrientationFix && key.height > key.width) {
            keySize = key.height
        } 

        let stab_spacing_left = null
        let stab_spacing_right = null
        
        if (keySize.gte(3)) {
            return null
        }
        else if (keySize.gte(2)) {
            stab_spacing_left = stab_spacing_right = new Decimal("18.25")
        }
        else if (keySize.gte(1.5)) {
            stab_spacing_left = stab_spacing_right = new Decimal("10.75")
        }
        else {
            return null
        }

        const width = new Decimal("2")
        const height = new Decimal("14")
        const plusHalfWidth = width.dividedBy(new Decimal("2"))
        const minsHalfWidth = width.dividedBy(new Decimal("-2"))
        const plusHalfHeight = height.dividedBy(new Decimal("2"))
        const minsHalfHeight = height.dividedBy(new Decimal("-2"))

        let upperLeft =  [minsHalfWidth.toNumber(), plusHalfHeight.toNumber()]
        let upperRight = [plusHalfWidth.toNumber(), plusHalfHeight.toNumber()]
        let lowerLeft =  [minsHalfWidth.toNumber(), minsHalfHeight.toNumber()]
        let lowerRight = [plusHalfWidth.toNumber(), minsHalfHeight.toNumber()]

        var singleCutout = {
            paths: {
                lineTop: new makerjs.paths.Line(upperLeft, upperRight),
                lineBottom: new makerjs.paths.Line(lowerLeft, lowerRight),
                lineLeft: new makerjs.paths.Line(upperLeft, lowerLeft),
                lineRight: new makerjs.paths.Line(upperRight, lowerRight)
            }
        }

        if (generatorOptions.stabilizerFilletRadius.gt(0)) {

            const filletNum = generatorOptions.stabilizerFilletRadius.toNumber()

            var filletTopLeft = makerjs.path.fillet(singleCutout.paths.lineTop, singleCutout.paths.lineLeft, filletNum)
            var filletTopRight = makerjs.path.fillet(singleCutout.paths.lineTop, singleCutout.paths.lineRight, filletNum)
            var filletBottomLeft = makerjs.path.fillet(singleCutout.paths.lineBottom, singleCutout.paths.lineLeft, filletNum)
            var filletBottomRight = makerjs.path.fillet(singleCutout.paths.lineBottom, singleCutout.paths.lineRight, filletNum)
            
            singleCutout.paths.filletTopLeft = filletTopLeft;
            singleCutout.paths.filletTopRight = filletTopRight;
            singleCutout.paths.filletBottomLeft = filletBottomLeft;
            singleCutout.paths.filletBottomRight = filletBottomRight;

        }

        var cutoutLeft = singleCutout;
        var cutoutRight = makerjs.model.clone(singleCutout);

        cutoutLeft = makerjs.model.move(cutoutLeft, [stab_spacing_left.times(-1).toNumber(), 0])
        cutoutRight = makerjs.model.move(cutoutRight, [stab_spacing_right.toNumber(), 0])

        let cutouts = {
            models: {
                "left": cutoutLeft,
                "right": cutoutRight
            }
        }

        if (!key.skipOrientationFix && key.height > key.width) {
            cutouts = makerjs.model.rotate(cutouts, -90)
        } 
        
        return cutouts;
    }
}