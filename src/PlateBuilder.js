// 导入必要的库和模块
import makerjs from 'makerjs'  // 用于生成几何图形的库
import Decimal from 'decimal.js'  // 高精度数值计算库，避免浮点数精度问题
// 导入各种卫星轴切割类型的生成器
import { StabilizerMXBasic } from './cutouts/StabilizerMXBasic'
import { StabilizerMXSmall } from './cutouts/StabilizerMXSmall'
import { StabilizerMXSpec } from './cutouts/StabilizerMXSpec'
import { StabilizerAlpsAEK } from './cutouts/StabilizerAlpsAEK'
import { StabilizerAlpsAT101 } from './cutouts/StabilizerAlpsAT101'
import { NullGenerator } from './cutouts/NullGenerator'  // 空生成器，用于不生成任何切割
// 导入声学切割（开槽）类型的生成器
import { AcousticMXBasic } from './cutouts/AcousticMXBasic'
import { AcousticMXExtreme } from './cutouts/AcousticMXExtreme'

/**
 * 创建基础的MX轴孔模型
 * @param {Object} key - 按键对象，包含位置、尺寸、角度等信息
 * @param {Object} options - 配置选项，包含轴孔尺寸、圆角等参数
 * @returns {Object} - 返回包含路径的几何模型
 */
function createBasicMXSwitchModel(key, options) {
  // 获取轴孔的高度和宽度
  const height = options.switchHeight
  const width = options.switchWidth
  // 计算轴孔的半宽和半高，用于定位各个顶点
  const halfWidth = width.dividedBy(new Decimal(2))
  const halfHeight = height.dividedBy(new Decimal(2))
  // 初始化模型对象，用于存储所有的路径
  let model = { paths: {} }
  // 如果设置了圆角半径，则创建带圆角的轴孔
  if (options.switchFilletRadius.gt(0)) {
    const filletNum = new Decimal(options.switchFilletRadius)
    // 根据是否启用狗骨孔来选择不同的生成方式
    if (!options.switchDogbone) {
      // 普通圆角模式：在矩形的四个角添加圆角
      // 定义矩形的四个顶点坐标
      const upperLeft = [halfWidth.negated().toNumber(), halfHeight.toNumber()]    // 左上角
      const upperRight = [halfWidth.toNumber(), halfHeight.toNumber()]             // 右上角
      const lowerLeft = [halfWidth.negated().toNumber(), halfHeight.negated().toNumber()]  // 左下角
      const lowerRight = [halfWidth.toNumber(), halfHeight.negated().toNumber()]   // 右下角

      // 创建矩形的四条边
      model.paths.lineTop = new makerjs.paths.Line(upperLeft, upperRight)      // 上边
      model.paths.lineBottom = new makerjs.paths.Line(lowerLeft, lowerRight)   // 下边
      model.paths.lineLeft = new makerjs.paths.Line(upperLeft, lowerLeft)      // 左边
      model.paths.lineRight = new makerjs.paths.Line(upperRight, lowerRight)   // 右边

      // 在四个角添加圆角
      model.paths.filletTopLeft = makerjs.path.fillet(model.paths.lineTop, model.paths.lineLeft, filletNum.toNumber())
      model.paths.filletTopRight = makerjs.path.fillet(model.paths.lineTop, model.paths.lineRight, filletNum.toNumber())
      model.paths.filletBottomLeft = makerjs.path.fillet(model.paths.lineBottom, model.paths.lineLeft, filletNum.toNumber())
      model.paths.filletBottomRight = makerjs.path.fillet(model.paths.lineBottom, model.paths.lineRight, filletNum.toNumber())
    } else {
      // 狗骨孔模式：创建更复杂的形状，便于激光切割
      const bigRadius = filletNum.times(2)  // 大圆弧的半径
      const sqrt2 = new Decimal(2).sqrt()   // 根号2，用于计算
      const shrink = filletNum.dividedBy(sqrt2).plus(filletNum)  // 收缩量计算
      const six = new Decimal(6)
      const four = new Decimal(4)
      // 计算第二个收缩量，用于确定弧形的精确位置
      const shrink2 = (six.times(filletNum)).pow(2).minus(
        four.times(filletNum).plus(shrink).pow(2)
      ).sqrt()
      // 计算收缩角度，用于确定弧形的起始和结束角度
      const shrinkAngle = Decimal.asin(shrink2.dividedBy(six.times(filletNum))).times(180).dividedBy(Decimal.acos(-1))
      // 定义四个大圆弧的圆心位置
      const Centers = [
        [halfWidth.negated().plus(shrink).toNumber(), halfHeight.minus(shrink).toNumber()],      // 左上角圆心
        [halfWidth.minus(shrink).toNumber(), halfHeight.minus(shrink).toNumber()],               // 右上角圆心
        [halfWidth.negated().plus(shrink).toNumber(), halfHeight.negated().plus(shrink).toNumber()], // 左下角圆心
        [halfWidth.minus(shrink).toNumber(), halfHeight.negated().plus(shrink).toNumber()]       // 右下角圆心
      ]
      // 为四个角创建大圆弧，每个角的起始和结束角度不同
      for (let i = 0; i < 4; i++) {
        let startAngle, endAngle
        switch (i) {
          case 0:  // 左上角
            startAngle = new Decimal(90).minus(shrinkAngle)
            endAngle = new Decimal(180).plus(shrinkAngle)
            break
          case 1:  // 右上角
            startAngle = new Decimal(360).minus(shrinkAngle)
            endAngle = new Decimal(90).plus(shrinkAngle)
            break
          case 2:  // 左下角
            startAngle = new Decimal(180).minus(shrinkAngle)
            endAngle = new Decimal(270).plus(shrinkAngle)
            break
          case 3:  // 右下角
            startAngle = new Decimal(270).minus(shrinkAngle)
            endAngle = new Decimal(360).plus(shrinkAngle)
            break
          default:
            // 默认情况，不应该到达这里
            startAngle = new Decimal(0)
            endAngle = new Decimal(90)
            break
        }
        // 创建大圆弧路径
        model.paths['bigCornerArc' + i] = new makerjs.paths.Arc(
          Centers[i],
          bigRadius.toNumber(),
          startAngle.toNumber(),
          endAngle.toNumber()
        )
      }
      const xOffset = halfWidth.plus(filletNum.times(4))
      const yOffset = halfHeight.plus(filletNum.times(4))
      const arcCenters = [
        [halfWidth.negated().plus(shrink).plus(shrink2).toNumber(), yOffset.toNumber()],
        [halfWidth.minus(shrink).minus(shrink2).toNumber(), yOffset.toNumber()],
        [halfWidth.negated().plus(shrink).plus(shrink2).toNumber(), yOffset.negated().toNumber()],
        [halfWidth.minus(shrink).minus(shrink2).toNumber(), yOffset.negated().toNumber()],
        [xOffset.negated().toNumber(), halfHeight.minus(shrink).minus(shrink2).toNumber()],
        [xOffset.negated().toNumber(), halfHeight.negated().plus(shrink).plus(shrink2).toNumber()],
        [xOffset.toNumber(), halfHeight.minus(shrink).minus(shrink2).toNumber()],
        [xOffset.toNumber(), halfHeight.negated().plus(shrink).plus(shrink2).toNumber()]
      ]
      const extraArcAngles = options.extraArcAngles || [
        { start: new Decimal(270).minus(shrinkAngle).toNumber(), end: 270 },
        { start: 270, end: new Decimal(270).plus(shrinkAngle).toNumber() },
        { start: 90, end: new Decimal(90).plus(shrinkAngle).toNumber() },
        { start: new Decimal(90).minus(shrinkAngle).toNumber(), end: 90 },
        { start: 0, end: shrinkAngle.toNumber() },
        { start: new Decimal(360).minus(shrinkAngle).toNumber(), end: 0 },
        { start: new Decimal(180).minus(shrinkAngle).toNumber(), end: 180 },
        { start: 180, end: new Decimal(180).plus(shrinkAngle).toNumber() }
      ]
      for (let i = 0; i < 8; i++) {
        const center = arcCenters[i]
        const { start, end } = extraArcAngles[i]
        model.paths['extraArc' + i] = new makerjs.paths.Arc(center, filletNum.times(4).toNumber(), start, end)
      }
      const upperLeft = [halfWidth.negated().plus(shrink).plus(shrink2).toNumber(), halfHeight.toNumber()]
      const upperRight = [halfWidth.minus(shrink).minus(shrink2).toNumber(), halfHeight.toNumber()]
      const lowerLeft = [halfWidth.negated().plus(shrink).plus(shrink2).toNumber(), halfHeight.negated().toNumber()]
      const lowerRight = [halfWidth.minus(shrink).minus(shrink2).toNumber(), halfHeight.negated().toNumber()]
      const leftUpper = [halfWidth.negated().toNumber(), halfHeight.minus(shrink).minus(shrink2).toNumber()]
      const leftLower = [halfWidth.negated().toNumber(), halfHeight.negated().plus(shrink).plus(shrink2).toNumber()]
      const rightUpper = [halfWidth.toNumber(), halfHeight.minus(shrink).minus(shrink2).toNumber()]
      const rightLower = [halfWidth.toNumber(), halfHeight.negated().plus(shrink).plus(shrink2).toNumber()]
      model.paths.lineTop = new makerjs.paths.Line(upperLeft, upperRight)
      model.paths.lineBottom = new makerjs.paths.Line(lowerLeft, lowerRight)
      model.paths.lineLeft = new makerjs.paths.Line(leftUpper, leftLower)
      model.paths.lineRight = new makerjs.paths.Line(rightUpper, rightLower)
    }
  }
  // 如果按键高度大于宽度且未跳过方向修正，则旋转模型90度
  // 这是为了确保轴孔的正确方向
  if (!key.skipOrientationFix && key.height > key.width) {
    model = makerjs.model.rotate(model, -90)
  }
  return model
}

/**
 * 创建极限开槽模型
 * @param {Object} key - 按键对象，包含位置、尺寸、角度等信息
 * @param {Object} options - 配置选项，包含开槽相关参数
 * @returns {Object} - 返回包含路径的开槽几何模型
 */
function createExtremeSlotModel(key, options) {
  // 获取开槽相关的参数
  const housing = options.switchHousingWidth || new Decimal(1)      // 轴框宽度
  const slot = options.slotWidth || new Decimal(1)                  // 槽宽
  const connector = options.connectorWidth || new Decimal(1.2)      // 连接宽度
  const width = options.switchWidth                                 // 轴孔宽度
  const height = options.switchHeight                               // 轴孔高度
  const halfWidth = width.dividedBy(new Decimal(2))                 // 轴孔半宽
  const halfHeight = height.dividedBy(new Decimal(2))               // 轴孔半高
  const acousticRadius = options.acousticFilletRadius || new Decimal(0.5)  // 开槽圆角半径

  // 定义四个角的符号，用于简化坐标计算
  const corners = [
    { xSign: 1, ySign: 1, name: '右上' },   // 右上角：x正，y正
    { xSign: -1, ySign: 1, name: '左上' },  // 左上角：x负，y正
    { xSign: -1, ySign: -1, name: '左下' }, // 左下角：x负，y负
    { xSign: 1, ySign: -1, name: '右下' }   // 右下角：x正，y负
  ]

  let slotModel = { paths: {} }  // 初始化开槽模型
  let lineIndex = 1              // 线段索引计数器
  let filletIndex = 1            // 圆角索引计数器

  // 判断圆角半径是否等于槽宽的一半，这会影响生成算法
  const isHalfSlotRadius = acousticRadius.equals(slot.dividedBy(2))

  corners.forEach((corner, cornerIdx) => {
    const xSign = corner.xSign
    const ySign = corner.ySign

    if (isHalfSlotRadius) {
      // 当圆角半径等于槽宽的一半时，使用特殊的半圆处理方式
      // 这种情况下，连接处会形成完美的半圆形状
      const p1 = [xSign * (halfWidth.plus(housing).toNumber()), ySign * (halfHeight.plus(housing).toNumber())] // 外角
      const p2 = [xSign * (connector.dividedBy(2).plus(acousticRadius).toNumber()), ySign * (halfHeight.plus(housing).toNumber())] // 内角，x坐标绝对值+圆角
      const p3 = [xSign * (connector.dividedBy(2).plus(acousticRadius).toNumber()), ySign * (halfHeight.plus(housing).plus(slot).toNumber())] // 内角延伸
      const p4 = [xSign * (halfWidth.plus(housing).plus(slot).toNumber()), ySign * (halfHeight.plus(housing).plus(slot).toNumber())] // 外角延伸
      const p5 = [xSign * (halfWidth.plus(housing).plus(slot).toNumber()), ySign * (connector.dividedBy(2).plus(acousticRadius).toNumber())] // 外角延伸，y坐标+圆角
      const p6 = [xSign * (halfWidth.plus(housing).toNumber()), ySign * (connector.dividedBy(2).plus(acousticRadius).toNumber())] // 外角，y坐标+圆角

      // 生成当前角的线段，跳过点2-3和点5-6之间的线段
      const points = [p1, p2, p3, p4, p5, p6]
      const createdLines = [] // 记录实际创建的线段

      for (let i = 0; i < 6; i++) {
        if (i !== 1 && i !== 4) { // 跳过点2-3(i=1)和点5-6(i=4)之间的线段
          const nextI = (i + 1) % 6
          const lineName = `line${lineIndex}`
          slotModel.paths[lineName] = new makerjs.paths.Line(points[i], points[nextI])
          createdLines.push(lineName)
          lineIndex++
        }
      }

      // 添加两个半圆来代替连接处的线段和圆角
      // 第一个半圆：圆心在(连接宽度/2+圆角，轴孔高/2+框宽+圆角)，开口朝向x轴外侧
      const semicircle1Center = [
        xSign * (connector.dividedBy(2).plus(acousticRadius).toNumber()),
        ySign * (halfHeight.plus(housing).plus(acousticRadius).toNumber())
      ]
      const semicircle1StartAngle = xSign > 0 ? 90 : 270
      const semicircle1EndAngle = xSign > 0 ? 270 : 90
      slotModel.paths[`semicircle1_${cornerIdx}`] = new makerjs.paths.Arc(
        semicircle1Center,
        acousticRadius.toNumber(),
        semicircle1StartAngle,
        semicircle1EndAngle
      )

      // 第二个半圆：圆心在(轴孔宽/2+框宽+圆角，连接宽度/2+圆角)，开口朝向y轴外侧
      const semicircle2Center = [
        xSign * (halfWidth.plus(housing).plus(acousticRadius).toNumber()),
        ySign * (connector.dividedBy(2).plus(acousticRadius).toNumber())
      ]
      // 修正左右两侧半圆的方向：左右两侧需要上下颠倒
      const semicircle2StartAngle = ySign > 0 ? 180 : 0
      const semicircle2EndAngle = ySign > 0 ? 0 : 180
      slotModel.paths[`semicircle2_${cornerIdx}`] = new makerjs.paths.Arc(
        semicircle2Center,
        acousticRadius.toNumber(),
        semicircle2StartAngle,
        semicircle2EndAngle
      )

      // 其他部分的圆角使用当前逻辑
      const radius = acousticRadius.toNumber() // 统一使用的圆角

      // 为所有存在的线段添加圆角
      // 创建的线段顺序：line0->line2, line2->line3, line3->line5, line5->line0
      for (let i = 0; i < createdLines.length; i++) {
        const currLine = createdLines[i]
        const nextLine = createdLines[(i + 1) % createdLines.length]

        slotModel.paths[`fillet${filletIndex}`] = makerjs.path.fillet(slotModel.paths[currLine], slotModel.paths[nextLine], radius)
        filletIndex++
      }
    } else {
      // 当圆角半径小于槽宽的一半时，使用标准的多边形+圆角处理方式
      // 每个角会生成6个交点，形成复杂的开槽形状
      const p1 = [xSign * (halfWidth.plus(housing).toNumber()), ySign * (halfHeight.plus(housing).toNumber())] // 外角
      const p2 = [xSign * (connector.dividedBy(2).toNumber()), ySign * (halfHeight.plus(housing).toNumber())] // 内角
      const p3 = [xSign * (connector.dividedBy(2).toNumber()), ySign * (halfHeight.plus(housing).plus(slot).toNumber())] // 内角延伸
      const p4 = [xSign * (halfWidth.plus(housing).plus(slot).toNumber()), ySign * (halfHeight.plus(housing).plus(slot).toNumber())] // 外角延伸
      const p5 = [xSign * (halfWidth.plus(housing).plus(slot).toNumber()), ySign * (connector.dividedBy(2).toNumber())] // 外角延伸
      const p6 = [xSign * (halfWidth.plus(housing).toNumber()), ySign * (connector.dividedBy(2).toNumber())] // 外角

      // 生成当前角的6条线段
      const points = [p1, p2, p3, p4, p5, p6]
      for (let i = 0; i < 6; i++) {
        const nextI = (i + 1) % 6
        slotModel.paths[`line${lineIndex}`] = new makerjs.paths.Line(points[i], points[nextI])
        lineIndex++
      }

      // 添加当前角的圆角
      const radius = acousticRadius.toNumber() // 统一使用的圆角

      for (let i = 0; i < 6; i++) {
        const prevLine = `line${lineIndex - 6 + (i - 1 + 6) % 6}`
        const currLine = `line${lineIndex - 6 + i}`
        slotModel.paths[`fillet${filletIndex}`] = makerjs.path.fillet(slotModel.paths[prevLine], slotModel.paths[currLine], radius)
        filletIndex++
      }
    }
  })

  return slotModel
}

/**
 * 创建轴孔美化模型（PCB层图形）
 * @param {Object} key - 按键对象，包含位置、尺寸、角度等信息
 * @param {Object} options - 配置选项，包含轴孔美化相关参数
 * @param {Array} origin - 按键的原点坐标
 * @param {Object} models - 模型集合对象
 * @param {number} id - 按键ID
 */
function createSwitchPatternModels(key, options, origin, models, id) {
  // 顶层铜箔：原始轴孔向外扩张0.5*线宽，形成铜箔走线
  const topExpansion = options.switchLineWidth.times(0.5)
  let topSwitchModel = makerjs.model.rotate(
    createBasicMXSwitchModel(key, options),
    key.angle.plus(key.independentSwitchAngle).negated().toNumber()
  )
  topSwitchModel = makerjs.model.outline(topSwitchModel, topExpansion.toNumber())
  topSwitchModel.origin = origin
  topSwitchModel.layer = "top"  // 设置为顶层
  models["SwitchTop" + id] = topSwitchModel

  // 底层铜箔：与顶层相同的处理
  let bottomSwitchModel = makerjs.model.rotate(
    createBasicMXSwitchModel(key, options),
    key.angle.plus(key.independentSwitchAngle).negated().toNumber()
  )
  bottomSwitchModel = makerjs.model.outline(bottomSwitchModel, topExpansion.toNumber())
  bottomSwitchModel.origin = origin
  bottomSwitchModel.layer = "bottom"  // 设置为底层
  models["SwitchBottom" + id] = bottomSwitchModel

  // 顶层阻焊层：向外扩张0.5*（线宽+阻焊扩展），防止焊接时短路
  const topSolderExpansion = options.switchLineWidth.plus(options.switchSolderMaskExpansion).times(0.5)
  let topSolderModel = makerjs.model.rotate(
    createBasicMXSwitchModel(key, options),
    key.angle.plus(key.independentSwitchAngle).negated().toNumber()
  )
  topSolderModel = makerjs.model.outline(topSolderModel, topSolderExpansion.toNumber())
  topSolderModel.origin = origin
  topSolderModel.layer = "topSolderMask"  // 设置为顶层阻焊层
  models["SwitchTopSolder" + id] = topSolderModel

  // 底层阻焊层：与顶层阻焊层相同的处理
  let bottomSolderModel = makerjs.model.rotate(
    createBasicMXSwitchModel(key, options),
    key.angle.plus(key.independentSwitchAngle).negated().toNumber()
  )
  bottomSolderModel = makerjs.model.outline(bottomSolderModel, topSolderExpansion.toNumber())
  bottomSolderModel.origin = origin
  bottomSolderModel.layer = "bottomSolderMask"  // 设置为底层阻焊层
  models["SwitchBottomSolder" + id] = bottomSolderModel
}

/**
 * 创建卫星轴美化模型（PCB层图形）
 * @param {Object} stabilizerModel - 卫星轴基础模型
 * @param {Object} options - 配置选项，包含卫星轴美化相关参数
 * @param {Object} models - 模型集合对象
 * @param {number} id - 按键ID
 */
function createStabilizerPatternModels(stabilizerModel, options, models, id) {
  // 顶层铜箔：原始卫星轴向外扩张0.5*线宽
  const stabTopExpansion = options.stabilizerLineWidth.times(0.5)
  let stabTopModel = makerjs.model.clone(stabilizerModel)
  stabTopModel = makerjs.model.outline(stabTopModel, stabTopExpansion.toNumber())
  stabTopModel.layer = "top"  // 设置为顶层
  models["StabilizerTop" + id] = stabTopModel

  // 底层铜箔：与顶层相同的处理
  let stabBottomModel = makerjs.model.clone(stabilizerModel)
  stabBottomModel = makerjs.model.outline(stabBottomModel, stabTopExpansion.toNumber())
  stabBottomModel.layer = "bottom"  // 设置为底层
  models["StabilizerBottom" + id] = stabBottomModel

  // 顶层阻焊层：向外扩张0.5*（线宽+阻焊扩展）
  const stabTopSolderExpansion = options.stabilizerLineWidth.plus(options.stabilizerSolderMaskExpansion).times(0.5)
  let stabTopSolderModel = makerjs.model.clone(stabilizerModel)
  stabTopSolderModel = makerjs.model.outline(stabTopSolderModel, stabTopSolderExpansion.toNumber())
  stabTopSolderModel.layer = "topSolderMask"  // 设置为顶层阻焊层
  models["StabilizerTopSolder" + id] = stabTopSolderModel

  // 底层阻焊层：与顶层阻焊层相同的处理
  let stabBottomSolderModel = makerjs.model.clone(stabilizerModel)
  stabBottomSolderModel = makerjs.model.outline(stabBottomSolderModel, stabTopSolderExpansion.toNumber())
  stabBottomSolderModel.layer = "bottomSolderMask"  // 设置为底层阻焊层
  models["StabilizerBottomSolder" + id] = stabBottomSolderModel
}

/**
 * 创建开槽美化花纹圆角模型
 * @param {Object} key - 按键对象，包含位置、尺寸、角度等信息
 * @param {Object} options - 配置选项，包含开槽美化相关参数
 * @param {Array} origin - 按键的原点坐标
 * @param {Object} models - 模型集合对象
 * @param {number} id - 按键ID
 */
function createSlotPatternCornerModels(key, options, origin, models, id) {
  // 获取开槽相关的参数
  const housing = options.switchHousingWidth || new Decimal(1)      // 轴框宽度
  const width = options.switchWidth                                 // 轴孔宽度
  const height = options.switchHeight                               // 轴孔高度
  const halfWidth = width.dividedBy(new Decimal(2))                 // 轴孔半宽
  const halfHeight = height.dividedBy(new Decimal(2))               // 轴孔半高

  // 极限开槽点1的坐标（右上角外角点）
  const extremeSlotPoint1X = halfWidth.plus(housing)
  const extremeSlotPoint1Y = halfHeight.plus(housing)

  // 计算弧线圆心坐标：以极限开槽点1为起点，xy轴绝对值都减去开槽美化线宽和开槽美化花纹圆角
  const arcCenterOffsetX = options.slotLineWidth.plus(options.slotPatternRadius)
  const arcCenterOffsetY = options.slotLineWidth.plus(options.slotPatternRadius)

  // 定义四个角的弧线圆心
  const arcCenters = [
    [extremeSlotPoint1X.minus(arcCenterOffsetX).toNumber(), extremeSlotPoint1Y.minus(arcCenterOffsetY).negated().toNumber()], // 右上角
    [extremeSlotPoint1X.minus(arcCenterOffsetX).negated().toNumber(), extremeSlotPoint1Y.minus(arcCenterOffsetY).negated().toNumber()], // 左上角
    [extremeSlotPoint1X.minus(arcCenterOffsetX).negated().toNumber(), extremeSlotPoint1Y.minus(arcCenterOffsetY).toNumber()], // 左下角
    [extremeSlotPoint1X.minus(arcCenterOffsetX).toNumber(), extremeSlotPoint1Y.minus(arcCenterOffsetY).toNumber()]  // 右下角
  ]

  // 顶层和底层的半径
  const topBottomRadius = options.slotPatternRadius.times(2).toNumber()
  // 顶层阻焊和底层阻焊的半径
  const solderRadius = options.slotPatternRadius.times(2).minus(options.slotSolderMaskExpansion.dividedBy(2)).toNumber()

  // 弧心方向朝向原点（与板框美化模型一样）
  const arcAngles = [
    [270, 360], // 右上
    [180, 270], // 左上
    [90, 180],  // 左下
    [0, 90]     // 右下
  ]

  // 创建顶层模型
  let slotTopCornerModel = { paths: {}, layer: "top" }
  for (let i = 0; i < 4; i++) {
    slotTopCornerModel.paths[`cornerArc${i}`] = new makerjs.paths.Arc(
      arcCenters[i], topBottomRadius, arcAngles[i][0], arcAngles[i][1]
    )
  }
  slotTopCornerModel.origin = origin
  models["SlotTopCorner" + id] = slotTopCornerModel

  // 创建底层模型（直接复制顶层）
  let slotBottomCornerModel = makerjs.model.clone(slotTopCornerModel)
  slotBottomCornerModel.layer = "bottom"
  models["SlotBottomCorner" + id] = slotBottomCornerModel

  // 创建顶层阻焊模型
  let slotTopSolderCornerModel = { paths: {}, layer: "topSolderMask" }
  for (let i = 0; i < 4; i++) {
    slotTopSolderCornerModel.paths[`cornerArc${i}`] = new makerjs.paths.Arc(
      arcCenters[i], solderRadius, arcAngles[i][0], arcAngles[i][1]
    )
  }
  slotTopSolderCornerModel.origin = origin
  models["SlotTopSolderCorner" + id] = slotTopSolderCornerModel

  // 创建底层阻焊模型（直接复制顶层阻焊）
  let slotBottomSolderCornerModel = makerjs.model.clone(slotTopSolderCornerModel)
  slotBottomSolderCornerModel.layer = "bottomSolderMask"
  models["SlotBottomSolderCorner" + id] = slotBottomSolderCornerModel
}

/**
 * 创建开槽美化模型（PCB层图形）
 * @param {Object} slotModel - 开槽基础模型
 * @param {Object} options - 配置选项，包含开槽美化相关参数
 * @param {Object} models - 模型集合对象
 * @param {number} id - 按键ID
 */
function createSlotPatternModels(slotModel, options, models, id) {
  // 顶层铜箔：开槽图形向外扩张0.5*线宽
  const slotTopExpansion = options.slotLineWidth.times(0.5)
  let slotTopModel = makerjs.model.clone(slotModel)
  slotTopModel = makerjs.model.outline(slotTopModel, slotTopExpansion.toNumber())
  slotTopModel.layer = "top"  // 设置为顶层
  models["SlotTop" + id] = slotTopModel

  // 底层铜箔：与顶层相同的处理
  let slotBottomModel = makerjs.model.clone(slotModel)
  slotBottomModel = makerjs.model.outline(slotBottomModel, slotTopExpansion.toNumber())
  slotBottomModel.layer = "bottom"  // 设置为底层
  models["SlotBottom" + id] = slotBottomModel

  // 顶层阻焊层：向外扩张0.5*（线宽+阻焊扩展）
  const slotTopSolderExpansion = options.slotLineWidth.plus(options.slotSolderMaskExpansion).times(0.5)
  let slotTopSolderModel = makerjs.model.clone(slotModel)
  slotTopSolderModel = makerjs.model.outline(slotTopSolderModel, slotTopSolderExpansion.toNumber())
  slotTopSolderModel.layer = "topSolderMask"  // 设置为顶层阻焊层
  models["SlotTopSolder" + id] = slotTopSolderModel

  // 底层阻焊层：与顶层阻焊层相同的处理
  let slotBottomSolderModel = makerjs.model.clone(slotModel)
  slotBottomSolderModel = makerjs.model.outline(slotBottomSolderModel, slotTopSolderExpansion.toNumber())
  slotBottomSolderModel.layer = "bottomSolderMask"  // 设置为底层阻焊层
  models["SlotBottomSolder" + id] = slotBottomSolderModel
}

/**
 * 创建板框美化模型（PCB层图形）
 * @param {Object} options - 配置选项，包含板框美化相关参数
 * @param {Decimal} minX - 最小X坐标
 * @param {Decimal} maxX - 最大X坐标
 * @param {Decimal} minY - 最小Y坐标
 * @param {Decimal} maxY - 最大Y坐标
 * @param {Object} models - 模型集合对象
 */
function createPlatePatternModels(options, minX, maxX, minY, maxY, models) {
  // 顶层铜箔：板框向内缩进0.5*线宽，形成板框内侧的铜箔走线
  const plateTopInset = options.plateLineWidth.times(0.5)
  const left = minX.plus(plateTopInset)      // 左边界内缩
  const right = maxX.minus(plateTopInset)    // 右边界内缩
  const top = maxY.minus(plateTopInset)      // 上边界内缩
  const bottom = minY.plus(plateTopInset)    // 下边界内缩
  const upperLeft = [left.toNumber(), top.negated().toNumber()]
  const upperRight = [right.toNumber(), top.negated().toNumber()]
  const lowerLeft = [left.toNumber(), bottom.negated().toNumber()]
  const lowerRight = [right.toNumber(), bottom.negated().toNumber()]
  let plateTopModel = {
    paths: {
      lineTop: new makerjs.paths.Line(upperLeft, upperRight),
      lineBottom: new makerjs.paths.Line(lowerLeft, lowerRight),
      lineLeft: new makerjs.paths.Line(upperLeft, lowerLeft),
      lineRight: new makerjs.paths.Line(upperRight, lowerRight)
    },
    layer: "top"
  }

  if (options.platePatternRadius && options.platePatternRadius.gt(0)) {
    const r = options.platePatternRadius.times(2).toNumber()
    plateTopModel.paths.filletTopLeft = makerjs.path.fillet(plateTopModel.paths.lineTop, plateTopModel.paths.lineLeft, r)
    plateTopModel.paths.filletTopRight = makerjs.path.fillet(plateTopModel.paths.lineTop, plateTopModel.paths.lineRight, r)
    plateTopModel.paths.filletBottomLeft = makerjs.path.fillet(plateTopModel.paths.lineBottom, plateTopModel.paths.lineLeft, r)
    plateTopModel.paths.filletBottomRight = makerjs.path.fillet(plateTopModel.paths.lineBottom, plateTopModel.paths.lineRight, r)

    // 添加4个弧形
    const mainRadius = options.plateRadius.toNumber()
    const arcRadius = Math.max(0, mainRadius - 0.5 * options.plateLineWidth.toNumber())
    if (arcRadius > 0) {
      // 板框本体圆角圆心
      const arcCenters = [
        [minX.plus(mainRadius).toNumber(), maxY.negated().plus(mainRadius).toNumber()], // 左上
        [maxX.minus(mainRadius).toNumber(), maxY.negated().plus(mainRadius).toNumber()], // 右上
        [minX.plus(mainRadius).toNumber(), minY.negated().minus(mainRadius).toNumber()], // 左下
        [maxX.minus(mainRadius).toNumber(), minY.negated().minus(mainRadius).toNumber()]  // 右下
      ]
      // 角度范围
      const arcAngles = [
        [180, 270], // 左上
        [270, 360], // 右上
        [90, 180],  // 左下
        [0, 90]     // 右下
      ]
      for (let i = 0; i < 4; i++) {
        plateTopModel.paths['beautyArc' + i] = new makerjs.paths.Arc(
          arcCenters[i], arcRadius, arcAngles[i][0], arcAngles[i][1]
        )
      }
    }
  }
  models["PlateTop"] = plateTopModel

  // 底层与顶层相同
  let plateBottomModel = JSON.parse(JSON.stringify(plateTopModel))
  plateBottomModel.layer = "bottom"
  models["PlateBottom"] = plateBottomModel

  // 顶层阻焊：向内缩进0.5*（线宽+阻焊扩展）
  const plateTopSolderInset = options.plateLineWidth.plus(options.plateSolderMaskExpansion).times(0.5)
  const leftS = minX.plus(plateTopSolderInset)
  const rightS = maxX.minus(plateTopSolderInset)
  const topS = maxY.minus(plateTopSolderInset)
  const bottomS = minY.plus(plateTopSolderInset)
  const upperLeftS = [leftS.toNumber(), topS.negated().toNumber()]
  const upperRightS = [rightS.toNumber(), topS.negated().toNumber()]
  const lowerLeftS = [leftS.toNumber(), bottomS.negated().toNumber()]
  const lowerRightS = [rightS.toNumber(), bottomS.negated().toNumber()]
  let plateTopSolderModel = {
    paths: {
      lineTop: new makerjs.paths.Line(upperLeftS, upperRightS),
      lineBottom: new makerjs.paths.Line(lowerLeftS, lowerRightS),
      lineLeft: new makerjs.paths.Line(upperLeftS, lowerLeftS),
      lineRight: new makerjs.paths.Line(upperRightS, lowerRightS)
    },
    layer: "topSolderMask"
  }

  if (options.platePatternRadius && options.platePatternRadius.gt(0)) {
    const r = options.platePatternRadius.times(2).toNumber()
    const rSolder = Math.max(0, r - 0.5 * options.plateSolderMaskExpansion.toNumber())
    if (rSolder > 0) {
      plateTopSolderModel.paths.filletTopLeft = makerjs.path.fillet(plateTopSolderModel.paths.lineTop, plateTopSolderModel.paths.lineLeft, rSolder)
      plateTopSolderModel.paths.filletTopRight = makerjs.path.fillet(plateTopSolderModel.paths.lineTop, plateTopSolderModel.paths.lineRight, rSolder)
      plateTopSolderModel.paths.filletBottomLeft = makerjs.path.fillet(plateTopSolderModel.paths.lineBottom, plateTopSolderModel.paths.lineLeft, rSolder)
      plateTopSolderModel.paths.filletBottomRight = makerjs.path.fillet(plateTopSolderModel.paths.lineBottom, plateTopSolderModel.paths.lineRight, rSolder)
    }

    // 添加4个弧形
    const mainRadius = options.plateRadius.toNumber()
    const arcRadius = Math.max(0, mainRadius - 0.5 * options.plateLineWidth.toNumber())
    const arcRadiusSolder = Math.max(0, arcRadius - 0.5 * options.plateSolderMaskExpansion.toNumber())
    if (arcRadiusSolder > 0) {
      const arcCenters = [
        [minX.plus(mainRadius).toNumber(), maxY.negated().plus(mainRadius).toNumber()], // 左上
        [maxX.minus(mainRadius).toNumber(), maxY.negated().plus(mainRadius).toNumber()], // 右上
        [minX.plus(mainRadius).toNumber(), minY.negated().minus(mainRadius).toNumber()], // 左下
        [maxX.minus(mainRadius).toNumber(), minY.negated().minus(mainRadius).toNumber()]  // 右下
      ]
      const arcAngles = [
        [180, 270], // 左上
        [270, 360], // 右上
        [90, 180],  // 左下
        [0, 90]     // 右下
      ]
      for (let i = 0; i < 4; i++) {
        plateTopSolderModel.paths['beautyArc' + i] = new makerjs.paths.Arc(
          arcCenters[i], arcRadiusSolder, arcAngles[i][0], arcAngles[i][1]
        )
      }
    }
  }
  models["PlateTopSolder"] = plateTopSolderModel

  // 底层阻焊与顶层阻焊相同
  let plateBottomSolderModel = JSON.parse(JSON.stringify(plateTopSolderModel))
  plateBottomSolderModel.layer = "bottomSolderMask"
  models["PlateBottomSolder"] = plateBottomSolderModel
}

/**
 * 构建键盘定位板的主函数
 * @param {Array} keyList - 按键列表，包含每个按键的位置、尺寸等信息
 * @param {Object} options - 构建选项，包含各种切割参数和美化设置
 * @returns {Object} - 返回包含所有模型的对象，用于生成SVG/DXF文件
 */
export function buildPlate(keyList, options) {
  let models = {}  // 存储所有生成的几何模型
  let id = 0       // 用于给每个模型分配唯一ID

  // 初始化边界框的最小最大值，用于计算整个键盘的尺寸
  let minX = new Decimal(Number.POSITIVE_INFINITY)
  let minY = new Decimal(Number.POSITIVE_INFINITY)
  let maxX = new Decimal(Number.NEGATIVE_INFINITY)
  let maxY = new Decimal(Number.NEGATIVE_INFINITY)

  // 检查是否有任何花纹选项开启（用于PCB美化）
  // const hasPattern = options.switchPattern || options.stabilizerPattern || options.acousticPattern || options.platePattern || options.slotPattern

  // 根据选择的卫星轴类型创建相应的生成器
  let stabilizerGen = null
  switch (options.stabilizerCutoutType) {
    case "mx-basic":      // Cherry MX 基础卫星轴
      stabilizerGen = new StabilizerMXBasic()
      break
    case "mx-small":      // Cherry MX 紧密配合卫星轴
      stabilizerGen = new StabilizerMXSmall()
      break
    case "mx-spec":       // Cherry MX 规格卫星轴
      stabilizerGen = new StabilizerMXSpec()
      break
    case "alps-aek":      // Alps AEK 卫星轴
      stabilizerGen = new StabilizerAlpsAEK()
      break
    case "alps-at101":    // Alps AT101 卫星轴
      stabilizerGen = new StabilizerAlpsAT101()
      break
    case "none":          // 不生成卫星轴
      stabilizerGen = new NullGenerator()
      break
    default:
      console.error("Unsupported stabilizer type")
      return null
  }
  // 根据选择的声学切割（开槽）类型创建相应的生成器
  let acousticGen = null
  switch (options.acousticCutoutType) {
    case "none":          // 不生成声学切割
      acousticGen = new NullGenerator()
      break
    case "mx-basic":      // Cherry MX 基础声学切割
      acousticGen = new AcousticMXBasic()
      break
    case "mx-extreme":    // Cherry MX 极限声学切割
      acousticGen = new AcousticMXExtreme()
      break
    default:
      console.error("Unsupported acoustic cutout type")
      return null
  }
  // 遍历每个按键，为每个按键生成相应的切割模型
  for (const key of keyList) {
    // 计算按键的实际位置坐标（以毫米为单位）
    const originX = key.centerX.times(options.unitWidth)   // X坐标 = 按键中心X * 单位宽度
    const originY = key.centerY.times(options.unitHeight)  // Y坐标 = 按键中心Y * 单位高度
    const origin = [originX.toNumber(), originY.negated().toNumber()]  // 转换为数组格式，Y轴取反

    // 创建轴孔模型并应用旋转
    let switchModel = makerjs.model.rotate(
      createBasicMXSwitchModel(key, options),
      key.angle.plus(key.independentSwitchAngle).negated().toNumber()  // 应用按键角度和独立轴孔角度
    )
    switchModel.origin = origin  // 设置模型的原点位置
    models["Switch" + id] = switchModel  // 将模型添加到模型集合中

    // 如果启用了轴孔花纹美化，调用函数生成PCB层的图形
    if (options.switchPattern) {
      createSwitchPatternModels(key, options, origin, models, id)
    }

    // 生成卫星轴切割模型
    let stabilizerModel = stabilizerGen.generate(key, options)
    if (stabilizerModel) {
      stabilizerModel.origin = origin  // 设置原点
      // 应用卫星轴的旋转角度
      stabilizerModel = makerjs.model.rotate(
        stabilizerModel,
        key.angle.plus(key.stabilizerAngle).negated().toNumber(),  // 按键角度 + 卫星轴角度
        origin
      )
      stabilizerModel.layer = "plate"  // 设置为定位板层
      models["Stabilizer" + id] = stabilizerModel

      // 如果启用了卫星轴花纹美化，调用函数生成PCB层的图形
      if (options.stabilizerPattern) {
        createStabilizerPatternModels(stabilizerModel, options, models, id)
      }
    }
    // 生成声学切割（开槽）模型
    let acousticModel = acousticGen.generate(key, options)
    if (acousticModel) {
      acousticModel.origin = origin  // 设置原点
      // 应用声学切割的旋转角度（通常与卫星轴角度相同）
      acousticModel = makerjs.model.rotate(
        acousticModel,
        key.angle.plus(key.stabilizerAngle).negated().toNumber(),
        origin
      )
      acousticModel.layer = "plate"  // 设置为定位板层
      models["Acoustic" + id] = acousticModel
    }
    // 计算当前按键的边界，用于确定整个键盘的边界框
    const keyMinX = originX.minus(key.width.times(options.unitWidth).times(0.5))   // 按键左边界
    const keyMaxX = originX.plus(key.width.times(options.unitWidth).times(0.5))    // 按键右边界
    const keyMinY = originY.minus(key.height.times(options.unitHeight).times(0.5)) // 按键下边界
    const keyMaxY = originY.plus(key.height.times(options.unitHeight).times(0.5))  // 按键上边界

    // 更新全局边界框
    if (keyMinX.lt(minX)) minX = keyMinX
    if (keyMinY.lt(minY)) minY = keyMinY
    if (keyMaxX.gt(maxX)) maxX = keyMaxX
    if (keyMaxY.gt(maxY)) maxY = keyMaxY
    // 如果启用了极限开槽功能，生成独立的开槽模型
    if (options.extremeSlot) {
      // 调用极限开槽模型生成函数
      let slotModel = createExtremeSlotModel(key, options)

      // 应用旋转和位置设置
      slotModel = makerjs.model.rotate(slotModel, key.angle.plus(key.independentSwitchAngle).negated().toNumber())
      slotModel.origin = origin      // 设置原点
      slotModel.layer = "plate"      // 设置为定位板层
      models["ExtremeSlot" + id] = slotModel  // 添加到模型集合

      // 如果启用了开槽美化，调用函数生成PCB层的图形
      if (options.slotPattern) {
        createSlotPatternModels(slotModel, options, models, id)

        // 当开槽美化花纹圆角大于0时，添加开槽美化花纹圆角模型
        if (options.slotPatternRadius && options.slotPatternRadius.gt(0)) {
          createSlotPatternCornerModels(key, options, origin, models, id)
        }
      }
    }
    id++  // 递增ID计数器，为下一个按键准备
  }

  // 根据所有按键的边界计算整个键盘的边界框（定位板的外框）
  const upperLeft = [minX.toNumber(), maxY.negated().toNumber()]    // 左上角
  const upperRight = [maxX.toNumber(), maxY.negated().toNumber()]   // 右上角
  const lowerLeft = [minX.toNumber(), minY.negated().toNumber()]    // 左下角
  const lowerRight = [maxX.toNumber(), minY.negated().toNumber()]   // 右下角

  // 创建边界框模型（定位板的外框）
  let boundingBox = {
    paths: {
      lineTop: new makerjs.paths.Line(upperLeft, upperRight),      // 上边
      lineBottom: new makerjs.paths.Line(lowerLeft, lowerRight),   // 下边
      lineLeft: new makerjs.paths.Line(upperLeft, lowerLeft),      // 左边
      lineRight: new makerjs.paths.Line(upperRight, lowerRight)    // 右边
    }
  }
  // 如果设置了板框圆角，则在四个角添加圆角
  if (options.plateRadius && options.plateRadius.gt(0)) {
    const plateRadiusNum = options.plateRadius.toNumber()
    boundingBox.paths.filletTopLeft = makerjs.path.fillet(boundingBox.paths.lineTop, boundingBox.paths.lineLeft, plateRadiusNum)
    boundingBox.paths.filletTopRight = makerjs.path.fillet(boundingBox.paths.lineTop, boundingBox.paths.lineRight, plateRadiusNum)
    boundingBox.paths.filletBottomLeft = makerjs.path.fillet(boundingBox.paths.lineBottom, boundingBox.paths.lineLeft, plateRadiusNum)
    boundingBox.paths.filletBottomRight = makerjs.path.fillet(boundingBox.paths.lineBottom, boundingBox.paths.lineRight, plateRadiusNum)
  }
  boundingBox.layer = "plate"  // 设置为定位板层
  models["BoundingBox0"] = boundingBox  // 添加到模型集合

  // 如果启用了板框花纹美化，调用函数生成向内缩进的PCB层图形
  if (options.platePattern) {
    createPlatePatternModels(options, minX, maxX, minY, maxY, models)
  }

  // 为所有没有指定图层的模型设置默认图层为"plate"
  Object.keys(models).forEach(key => {
    if (!models[key].layer) {
      models[key].layer = "plate"  // 默认为定位板层
    }
  })

  // 返回包含所有模型的对象，供后续生成SVG/DXF文件使用
  return { models }
}