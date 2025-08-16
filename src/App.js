// 导入React相关的钩子函数
import { useState, useEffect } from "react"
// 导入Bootstrap UI组件
import { Button, Container, Card, Form, Row, Col, Image, Tab, Nav } from 'react-bootstrap'
// 导入自定义模块
import { parseKle } from "./KLEParser"        // KLE数据解析器
import { buildPlate } from "./PlateBuilder"   // 定位板构建器
import Decimal from "decimal.js"              // 高精度数值计算库
import makerjs from 'makerjs'                 // 几何图形生成库
import fileDownload from 'js-file-download'   // 文件下载工具
import { DataHelpPane, SwitchCutoutPane, OtherCutoutPane, AdvancedPane } from './HelpPanes'  // 帮助面板组件

/**
 * 主应用组件 - 键盘定位板生成器
 * 提供用户界面来配置各种参数并生成键盘定位板的SVG和DXF文件
 */
function App() {
  // KLE（Keyboard Layout Editor）数据状态，包含默认的键盘布局
  const [kleText, setKleText] = useState(`[
  [{a:7},"","","","","","","","","","","",""],
["","","","","","","","","","","",""],
["","","","","","","","","","","",""],
[{w:1.25},"","","","",{w:1.25},"","",{w:1.25},"","","","",{w:1.25},""]
]`)
  // 生成的文件数据状态
  const [previewSvg, setPreviewSvg] = useState(null)  // 预览用的SVG数据
  const [plateSvg, setPlateSvg] = useState(null)      // 下载用的SVG数据
  const [plateDxf, setPlateDxf] = useState(null)      // 下载用的DXF数据
  // 轴孔相关参数状态
  const [switchHeight, setSwitchHeight] = useState(14)                    // 轴孔高度(mm)
  const [switchWidth, setSwitchWidth] = useState(14)                      // 轴孔宽度(mm)
  const [switchRadius, setSwitchRadius] = useState(0.5)                   // 轴孔圆角半径(mm)
  const [switchDogbone, setSwitchDogbone] = useState(true)                // 是否启用狗骨孔
  const [switchPattern, setSwitchPattern] = useState(true)                // 是否启用轴孔花纹美化
  const [switchLineWidth, setSwitchLineWidth] = useState(0.5)             // 轴孔花纹线宽(mm)
  const [switchSolderMaskExpansion, setSwitchSolderMaskExpansion] = useState(0.051)  // 轴孔阻焊扩展(mm)

  // 卫星轴相关参数状态
  const [stabilizerCutoutType, setStabilizerCutoutType] = useState("mx-basic")  // 卫星轴类型
  const [stabilizerRadius, setStabilizerRadius] = useState(0.5)                 // 卫星轴圆角半径(mm)

  const [stabilizerPattern, setStabilizerPattern] = useState(true)              // 是否启用卫星轴花纹美化
  const [stabilizerLineWidth, setStabilizerLineWidth] = useState(0.5)           // 卫星轴花纹线宽(mm)
  const [stabilizerSolderMaskExpansion, setStabilizerSolderMaskExpansion] = useState(0.051)  // 卫星轴阻焊扩展(mm)

  // 开槽相关参数状态
  const [acousticCutoutType, setAcousticCutoutType] = useState("none")          // 声学切割类型
  const [acousticRadius, setAcousticRadius] = useState(0.5)                     // 开槽圆角半径(mm)
  const [acousticPattern, setAcousticPattern] = useState(true)                  // 是否启用声学切割花纹美化
  const [slotWidth, setSlotWidth] = useState(1)                                 // 槽宽(mm)
  const [switchHousingWidth, setSwitchHousingWidth] = useState(1)               // 轴框宽度(mm)
  const [connectorWidth, setConnectorWidth] = useState(1.2)                     // 连接宽度(mm)
  const [extremeSlot, setExtremeSlot] = useState(true)                          // 是否启用极限开槽
  const [slotPattern, setSlotPattern] = useState(true)                          // 是否启用开槽花纹美化
  const [slotLineWidth, setSlotLineWidth] = useState(0.5)                       // 开槽花纹线宽(mm)
  const [slotSolderMaskExpansion, setSlotSolderMaskExpansion] = useState(0.051) // 开槽阻焊扩展(mm)
  const [slotPatternRadius, setSlotPatternRadius] = useState(0.25)              // 开槽花纹圆角(mm)
  const [acousticLineWidth, setAcousticLineWidth] = useState(0.5)               // 声学切割线宽(mm)
  const [acousticSolderMaskExpansion, setAcousticSolderMaskExpansion] = useState(0.051)  // 声学切割阻焊扩展(mm)

  // 板框相关参数状态
  const [plateRadius, setPlateRadius] = useState(1)                            // 板框圆角半径(mm)
  const [platePattern, setPlatePattern] = useState(true)                       // 是否启用板框花纹美化
  const [plateLineWidth, setPlateLineWidth] = useState(1)                      // 板框花纹线宽(mm)
  const [plateSolderMaskExpansion, setPlateSolderMaskExpansion] = useState(0.051)  // 板框阻焊扩展(mm)

  const [platePatternRadius, setPlatePatternRadius] = useState(0.5)            // 板框花纹圆角(mm)

  // 键位单位尺寸参数状态
  const [unitWidth, setUnitWidth] = useState(19.05)   // 键位单位宽度(mm)，标准为19.05mm
  const [unitHeight, setUnitHeight] = useState(19.05) // 键位单位高度(mm)，标准为19.05mm

  // 主要的副作用钩子：当任何参数改变时重新生成定位板
  useEffect(() => {
    // 解析KLE数据，获取按键列表
    const kleReturn = parseKle(kleText)

    // 如果解析成功且有按键数据，则开始构建定位板
    if (kleReturn && kleReturn.length > 0) {
      try {
        // 构建定位板，将所有参数传递给构建器
        const plateData = buildPlate(kleReturn, {
          // 轴孔相关参数
          switchHeight: new Decimal(switchHeight),                              // 轴孔高度
          switchWidth: new Decimal(switchWidth),                                // 轴孔宽度
          switchFilletRadius: new Decimal(switchRadius),                        // 轴孔圆角半径
          switchDogbone: switchDogbone,                                         // 轴孔狗骨孔开关
          switchPattern: switchPattern,                                         // 轴孔花纹开关
          switchLineWidth: new Decimal(switchLineWidth),                        // 轴孔花纹线宽
          switchSolderMaskExpansion: new Decimal(switchSolderMaskExpansion),    // 轴孔阻焊扩展

          // 卫星轴相关参数
          stabilizerCutoutType: stabilizerCutoutType,                           // 卫星轴类型
          stabilizerFilletRadius: new Decimal(stabilizerRadius),                // 卫星轴圆角半径

          stabilizerPattern: stabilizerPattern,                                 // 卫星轴花纹开关
          stabilizerLineWidth: new Decimal(stabilizerLineWidth),                // 卫星轴花纹线宽
          stabilizerSolderMaskExpansion: new Decimal(stabilizerSolderMaskExpansion), // 卫星轴阻焊扩展

          // 声学切割（开槽）相关参数
          acousticCutoutType: acousticCutoutType,                               // 声学切割类型
          acousticFilletRadius: new Decimal(acousticRadius),                    // 开槽圆角半径
          acousticPattern: acousticPattern,                                     // 声学切割花纹开关
          acousticLineWidth: new Decimal(acousticLineWidth),                    // 声学切割花纹线宽
          acousticSolderMaskExpansion: new Decimal(acousticSolderMaskExpansion), // 声学切割阻焊扩展

          // 板框相关参数
          plateRadius: new Decimal(plateRadius),                                // 板框圆角半径
          platePattern: platePattern,                                           // 板框花纹开关
          plateLineWidth: new Decimal(plateLineWidth),                          // 板框花纹线宽
          plateSolderMaskExpansion: new Decimal(plateSolderMaskExpansion),      // 板框阻焊扩展

          platePatternRadius: new Decimal(platePatternRadius),                  // 板框花纹圆角

          // 基础尺寸参数
          unitWidth: new Decimal(unitWidth),                                    // 键位单位宽度
          unitHeight: new Decimal(unitHeight),                                  // 键位单位高度

          // 极限开槽相关参数
          slotWidth: new Decimal(slotWidth),                                    // 槽宽
          switchHousingWidth: new Decimal(switchHousingWidth),                  // 轴框宽度
          connectorWidth: new Decimal(connectorWidth),                          // 连接宽度
          extremeSlot: extremeSlot,                                             // 极限开槽开关
          slotPattern: slotPattern,                                             // 开槽花纹开关
          slotLineWidth: new Decimal(slotLineWidth),                            // 开槽花纹线宽
          slotSolderMaskExpansion: new Decimal(slotSolderMaskExpansion),        // 开槽阻焊扩展
          slotPatternRadius: new Decimal(slotPatternRadius),                    // 开槽花纹圆角
        })

        // 生成预览用的SVG数据（白色描边，适合深色背景显示）
        const previewSvgData = makerjs.exporter.toSVG(plateData, {
          stroke: 'white',           // 白色描边，适合深色预览背景
          strokeWidth: '0.5mm',      // 描边宽度
          svgAttrs: {
            width: '100%',           // 自适应宽度
            height: '100%'           // 自适应高度
          }
        })
        setPreviewSvg(previewSvgData)

        // 生成下载用的SVG数据（标准格式，单位为毫米）
        const svgData = makerjs.exporter.toSVG(plateData, {
          units: makerjs.unitType.Millimeter  // 设置单位为毫米
        })
        setPlateSvg(svgData)

        // 生成DXF数据（CAD格式，包含图层颜色设置）
        const dxfData = makerjs.exporter.toDXF(plateData, {
          units: makerjs.unitType.Millimeter,  // 设置单位为毫米
          layerOptions: {
            plate: { color: 6 },              // 定位板层：紫红色
            top: { color: 1 },                // 顶层铜箔：红色
            bottom: { color: 5 },             // 底层铜箔：蓝色
            topSolderMask: { color: 2 },      // 顶层阻焊：黄色
            bottomSolderMask: { color: 3 }    // 底层阻焊：绿色
          }
        })
        setPlateDxf(dxfData)

      } catch (error) {
        // 如果构建过程中出现错误，清空所有生成的数据
        console.log(error)
        setPreviewSvg(null)
        setPlateSvg(null)
        setPlateDxf(null)
      }
    } else {
      // 如果KLE数据解析失败或为空，清空所有生成的数据
      setPreviewSvg(null)
      setPlateSvg(null)
      setPlateDxf(null)
    }

  }, [
    // 依赖数组：当这些状态中的任何一个发生变化时，都会重新执行useEffect
    kleText,                          // KLE数据
    switchHeight,                     // 轴孔高度
    switchWidth,                      // 轴孔宽度
    switchRadius,                     // 轴孔圆角
    switchDogbone,                    // 轴孔狗骨孔
    switchPattern,                    // 轴孔花纹
    switchLineWidth,                  // 轴孔线宽
    switchSolderMaskExpansion,        // 轴孔阻焊扩展
    stabilizerCutoutType,             // 卫星轴类型
    stabilizerRadius,                 // 卫星轴圆角

    stabilizerPattern,                // 卫星轴花纹
    stabilizerLineWidth,              // 卫星轴线宽
    stabilizerSolderMaskExpansion,    // 卫星轴阻焊扩展
    acousticCutoutType,               // 声学切割类型
    acousticRadius,                   // 开槽圆角
    acousticPattern,                  // 声学切割花纹
    slotWidth,                        // 槽宽
    switchHousingWidth,               // 轴框宽度
    plateRadius,                      // 板框圆角
    platePattern,                     // 板框花纹
    plateLineWidth,                   // 板框线宽
    plateSolderMaskExpansion,         // 板框阻焊扩展

    unitWidth,                        // 键位单位宽度
    unitHeight,                       // 键位单位高度
    platePatternRadius,               // 板框花纹圆角
    connectorWidth,                   // 连接宽度
    extremeSlot,                      // 极限开槽
    slotPattern,                      // 开槽花纹
    slotLineWidth,                    // 开槽线宽
    slotSolderMaskExpansion,          // 开槽阻焊扩展
    slotPatternRadius,                // 开槽花纹圆角
    acousticLineWidth,                // 声学切割线宽
    acousticSolderMaskExpansion       // 声学切割阻焊扩展
  ])

  // 槽宽变化时的副作用：确保圆角半径不超过槽宽的一半
  useEffect(() => {
    // 当槽宽变化时，检查并调整圆角半径的值
    const newDefaultRadius = slotWidth / 2  // 计算新的默认圆角半径
    if (acousticRadius > slotWidth) {
      setAcousticRadius(slotWidth)  // 如果当前圆角半径超过槽宽，则调整为槽宽值
    }
  }, [slotWidth])  // 仅当槽宽改变时执行

  /**
   * 下载文件的辅助函数
   * @param {string} fileData - 文件数据内容
   * @param {string} extension - 文件扩展名（如.svg, .dxf）
   */
  const downloadData = (fileData, extension) => {
    const date = new Date(Date.now())  // 获取当前时间
    // 生成带时间戳的文件名并下载
    fileDownload(fileData, "plate-" + date.toISOString() + extension)
  }

  // 渲染主界面
  return (
    <Container className="App justify-content-center" style={{ textAlign: "center", maxWidth: "1200px" }}>
      {/* 顶部间距 */}
      <div className="pt-4 pb-4">
      </div>

      {/* KLE数据输入区域 */}
      <Card className="rounded shadow overflow-hidden mb-5">
        <Card.Body className="p-0">
          <Row>
            <Col xl={5} className="pt-3 pb-0 ps-4 pe-4">
              <h3>KLE 数据</h3>
              <p>请查看底部的信息块了解旋转稳定器等功能。</p>
            </Col>
            <Col xl={7}>
              <Form>
                <Form.Control
                  as="textarea"
                  type="text"
                  style={{
                    fontFamily: 'monospace',  // 使用等宽字体，便于查看JSON格式
                    height: '20vh',           // 高度为视口高度的20%
                    minHeight: "225px"        // 最小高度225像素
                  }}
                  spellCheck="false"          // 禁用拼写检查
                  placeholder="在此粘贴 KLE 原始数据或 JSON"
                  onChange={text => setKleText(text.target.value)}  // 文本改变时更新状态
                />
              </Form>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* 主要参数配置区域 */}
      <Card className="rounded shadow overflow-hidden mb-5">
        <Card.Body>
          <Row>
            {/* 轴孔参数配置列 */}
            <Col lg={3}>
              <h3>轴孔</h3>
              <Form className="ms-3 me-3">
                <Row>
                  <Col xs={6}>
                    <Form.Label>孔高 (mm)</Form.Label>
                    <Form.Control
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      max="50"
                      defaultValue="14"
                      className="mb-3"
                      onChange={e => setSwitchHeight(parseFloat(e.target.value))}
                    />
                  </Col>
                  <Col xs={6}>
                    <Form.Label>键高 (mm)</Form.Label>
                    <Form.Control
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      max="100"
                      defaultValue="19.05"
                      className="mb-3"
                      onChange={e => setUnitHeight(parseFloat(e.target.value))}
                    />
                  </Col>
                </Row>
                <Row>
                  <Col xs={6}>
                    <Form.Label>孔宽 (mm)</Form.Label>
                    <Form.Control
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      max="50"
                      defaultValue="14"
                      className="mb-3"
                      onChange={e => setSwitchWidth(parseFloat(e.target.value))}
                    />
                  </Col>
                  <Col xs={6}>
                    <Form.Label>键宽 (mm)</Form.Label>
                    <Form.Control
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      max="100"
                      defaultValue="19.05"
                      className="mb-3"
                      onChange={e => setUnitWidth(parseFloat(e.target.value))}
                    />
                  </Col>
                </Row>
                <Form.Label>圆角 (mm)</Form.Label>
                <Form.Control
                  type="number"
                  required
                  step="0.1"
                  min="0"
                  max="10"
                  defaultValue="0.5"
                  className="mb-3"
                  onChange={e => setSwitchRadius(parseFloat(e.target.value))}
                />
                <Row>
                  <Col xs={6}>
                    <Form.Check
                      type="checkbox"
                      id="switch-dogbone"
                      label="狗骨孔"
                      defaultChecked={true}
                      className="mb-3"
                      onChange={e => setSwitchDogbone(e.target.checked)}
                    />
                  </Col>
                </Row>
              </Form>
            </Col>

            {/* 卫星轴参数配置列 */}
            <Col lg={3}>
              <h3>卫星轴</h3>
              <Form className="ms-3 me-3">
                <Form.Label>种类</Form.Label>
                <Form.Select
                  aria-label="stabilizer-cutout-type"
                  selected="mx-basic"
                  className="mb-3"
                  onChange={e => setStabilizerCutoutType(e.target.value)}
                >
                  <option value="mx-basic">Cherry MX 基础</option>
                  <option value="mx-small">Cherry MX 紧密配合</option>
                  <option value="mx-spec">Cherry MX 规格</option>
                  <option value="alps-aek">Alps AEK</option>
                  <option value="alps-at101">Alps AT101</option>
                  <option value="none">无</option>
                </Form.Select>

                <Form.Label>圆角 (mm)</Form.Label>
                <Form.Control
                  type="number"
                  required
                  step="0.1"
                  min="0"
                  max="10"
                  defaultValue="0.5"
                  className="mb-3"
                  onChange={e => setStabilizerRadius(parseFloat(e.target.value))}
                />


              </Form>
            </Col>

            {/* 开槽参数配置列 */}
            <Col lg={3}>
              <h3>开槽</h3>
              <Form className="ms-3 me-3">
                <Form.Label>种类</Form.Label>
                <Form.Select
                  aria-label="acoustic-cutout-type"
                  selected="none"
                  className="mb-3"
                  onChange={e => setAcousticCutoutType(e.target.value)}
                >
                  <option value="none">无</option>
                  <option value="mx-basic">Cherry MX 基础</option>
                  <option value="mx-extreme">Cherry MX 极限</option>
                </Form.Select>

                <Form.Check
                  type="checkbox"
                  id="extreme-slot"
                  label="极限开槽"
                  checked={extremeSlot}
                  className="mb-3"
                  onChange={e => setExtremeSlot(e.target.checked)}
                />

                {extremeSlot && (
                  <>
                    <Row>
                      <Col xs={6}>
                        <Form.Label>槽宽 (mm)</Form.Label>
                        <Form.Control
                          type="number"
                          required
                          step="0.1"
                          min="0.1"
                          max="10"
                          defaultValue="1"
                          className="mb-3"
                          onChange={e => setSlotWidth(parseFloat(e.target.value))}
                        />
                      </Col>
                      <Col xs={6}>
                        <Form.Label>圆角 (mm)</Form.Label>
                        <Form.Control
                          type="number"
                          required
                          step="0.1"
                          min="0"
                          max={slotWidth / 2}
                          defaultValue={slotWidth / 2}
                          value={acousticRadius}
                          className="mb-3"
                          onChange={e => setAcousticRadius(parseFloat(e.target.value))}
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col xs={6}>
                        <Form.Label>轴框宽度 (mm)</Form.Label>
                        <Form.Control
                          type="number"
                          required
                          step="0.1"
                          min="0.1"
                          max="10"
                          defaultValue="1"
                          className="mb-3"
                          onChange={e => setSwitchHousingWidth(parseFloat(e.target.value))}
                        />
                      </Col>
                      <Col xs={6}>
                        <Form.Label>连接宽度 (mm)</Form.Label>
                        <Form.Control
                          type="number"
                          required
                          step="0.01"
                          min="0.1"
                          max="10"
                          defaultValue="1.2"
                          className="mb-3"
                          onChange={e => setConnectorWidth(parseFloat(e.target.value))}
                        />
                      </Col>
                    </Row>
                  </>
                )}
              </Form>
            </Col>

            {/* 板框参数配置列 */}
            <Col lg={3}>
              <h3>板框</h3>
              <Form className="ms-3 me-3">
                <Form.Label>圆角 (mm)</Form.Label>
                <Form.Control
                  type="number"
                  required
                  step="0.1"
                  min="0"
                  max="10"
                  value={plateRadius}
                  className="mb-3"
                  onChange={e => setPlateRadius(parseFloat(e.target.value))}
                />

              </Form>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* 美化设置区域 */}
      <Card className="rounded shadow overflow-hidden mb-5">
        <Card.Body>
          <Row>
            <Col lg={12}>
              <Form className="ms-3 me-3">
                <Row>
                  {/* 轴孔美化设置列 */}
                  <Col lg={3}>
                    <h5>轴孔美化</h5>
                    <Form.Check
                      type="checkbox"
                      id="switch-pattern"
                      label="启用花纹"
                      checked={switchPattern}
                      className="mb-3"
                      onChange={e => setSwitchPattern(e.target.checked)}
                    />
                    {switchPattern && (
                      <>
                        <Form.Label>线宽 (mm)</Form.Label>
                        <Form.Control
                          type="number"
                          required
                          step="0.001"
                          min="0"
                          max="5"
                          defaultValue="0.5"
                          className="mb-3"
                          onChange={e => setSwitchLineWidth(parseFloat(e.target.value))}
                        />
                        <Form.Label>阻焊扩展 (mm)</Form.Label>
                        <Form.Control
                          type="number"
                          required
                          step="0.001"
                          min="0"
                          max="1"
                          defaultValue="0.051"
                          className="mb-3"
                          onChange={e => setSwitchSolderMaskExpansion(parseFloat(e.target.value))}
                        />
                      </>
                    )}
                  </Col>
                  {/* 卫星轴美化设置列 */}
                  <Col lg={3}>
                    <h5>卫星轴美化</h5>
                    <Form.Check
                      type="checkbox"
                      id="stabilizer-pattern"
                      label="启用花纹"
                      checked={stabilizerPattern}
                      className="mb-3"
                      onChange={e => setStabilizerPattern(e.target.checked)}
                    />
                    {stabilizerPattern && (
                      <>
                        <Form.Label>线宽 (mm)</Form.Label>
                        <Form.Control
                          type="number"
                          required
                          step="0.001"
                          min="0"
                          max="5"
                          defaultValue="0.5"
                          className="mb-3"
                          onChange={e => setStabilizerLineWidth(parseFloat(e.target.value))}
                        />
                        <Form.Label>阻焊扩展 (mm)</Form.Label>
                        <Form.Control
                          type="number"
                          required
                          step="0.001"
                          min="0"
                          max="1"
                          defaultValue="0.051"
                          className="mb-3"
                          onChange={e => setStabilizerSolderMaskExpansion(parseFloat(e.target.value))}
                        />
                      </>
                    )}
                  </Col>
                  {/* 开槽美化设置列 */}
                  <Col lg={3}>
                    <h5>开槽美化</h5>
                    <Form.Check
                      type="checkbox"
                      id="slot-pattern"
                      label="启用花纹"
                      checked={slotPattern}
                      className="mb-3"
                      onChange={e => setSlotPattern(e.target.checked)}
                    />
                    {slotPattern && (
                      <>
                        <Form.Label>线宽 (mm)</Form.Label>
                        <Form.Control
                          type="number"
                          required
                          step="0.001"
                          min="0"
                          max="5"
                          defaultValue="0.5"
                          className="mb-3"
                          onChange={e => setSlotLineWidth(parseFloat(e.target.value))}
                        />
                        <Form.Label>阻焊扩展 (mm)</Form.Label>
                        <Form.Control
                          type="number"
                          required
                          step="0.001"
                          min="0"
                          max="1"
                          defaultValue="0.051"
                          className="mb-3"
                          onChange={e => setSlotSolderMaskExpansion(parseFloat(e.target.value))}
                        />
                        <Form.Label>花纹圆角 (mm)</Form.Label>
                        <Form.Control
                          type="number"
                          required
                          step="0.01"
                          min="0"
                          max="10"
                          defaultValue="0.25"
                          className="mb-3"
                          onChange={e => setSlotPatternRadius(parseFloat(e.target.value))}
                        />
                      </>
                    )}
                  </Col>
                  {/* 板框美化设置列 */}
                  <Col lg={3}>
                    <h5>板框美化</h5>
                    <Form.Check
                      type="checkbox"
                      id="plate-pattern"
                      label="启用花纹"
                      checked={platePattern}
                      className="mb-3"
                      onChange={e => setPlatePattern(e.target.checked)}
                    />
                    {platePattern && (
                      <>
                        <Form.Label>线宽 (mm)</Form.Label>
                        <Form.Control
                          type="number"
                          required
                          step="0.001"
                          min="0"
                          max="5"
                          defaultValue="1"
                          className="mb-3"
                          onChange={e => setPlateLineWidth(parseFloat(e.target.value))}
                        />
                        <Form.Label>阻焊扩展 (mm)</Form.Label>
                        <Form.Control
                          type="number"
                          required
                          step="0.001"
                          min="0"
                          max="1"
                          defaultValue="0.051"
                          className="mb-3"
                          onChange={e => setPlateSolderMaskExpansion(parseFloat(e.target.value))}
                        />
                        <Form.Label>花纹圆角 (mm)</Form.Label>
                        <Form.Control
                          type="number"
                          required
                          step="0.01"
                          min="0"
                          max="10"
                          defaultValue="0.5"
                          className="mb-3"
                          onChange={e => setPlatePatternRadius(parseFloat(e.target.value))}
                        />
                      </>
                    )}
                  </Col>
                </Row>
              </Form>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* 预览和下载区域 */}
      <Card className="p-0 rounded shadow bg-dark mb-5 overflow-hidden">
        {/* SVG预览区域，使用深色背景 */}
        <Card.Body
          className="bg-dark p-4"
          style={{ height: "30vh", minHeight: "250px" }}
          dangerouslySetInnerHTML={{ __html: previewSvg }}  // 直接插入SVG HTML
        />
        {/* 下载按钮区域 */}
        <Card.Footer>
          {/* 根据数据是否生成成功来显示相应的下载按钮 */}
          {plateDxf &&
            <Button variant="light" className="me-3" onClick={() => { downloadData(plateDxf, ".dxf") }}>
              下载 DXF
            </Button>
          }
          {plateSvg &&
            <Button variant="light" onClick={() => { downloadData(plateSvg, ".svg") }}>
              下载 SVG
            </Button>
          }
          {/* 如果数据未生成成功，显示禁用状态的按钮 */}
          {!plateDxf &&
            <Button variant="light" className="me-3" disabled>下载 DXF</Button>
          }
          {!plateSvg &&
            <Button variant="light" disabled>下载 SVG</Button>
          }
        </Card.Footer>
      </Card>

      {/* 帮助信息标签页区域 */}
      <Card className="rounded shadow overflow-hidden mb-5">
        <Tab.Container id="left-tabs-example" defaultActiveKey="data">
          <Row>
            {/* 左侧标签导航 */}
            <Col lg={4} as={Card.Header}>
              <Nav variant="pills" className="flex-column">
                <Nav.Item className="me-0">
                  <Nav.Link eventKey="data">自定义标志</Nav.Link>
                </Nav.Item>
                <Nav.Item className="me-0">
                  <Nav.Link eventKey="switch-cutout">轴孔设置</Nav.Link>
                </Nav.Item>
                <Nav.Item className="me-0">
                  <Nav.Link eventKey="stabilizer-cutout">卫星轴设置</Nav.Link>
                </Nav.Item>
                <Nav.Item className="me-0">
                  <Nav.Link eventKey="acoustic-cutout">开槽设置</Nav.Link>
                </Nav.Item>
                <Nav.Item className="me-0">
                  <Nav.Link eventKey="plate-settings">板框设置</Nav.Link>
                </Nav.Item>
              </Nav>
            </Col>
            {/* 右侧标签内容 */}
            <Col lg={8} as={Card.Body} className="p-4">
              <Tab.Content>
                <Tab.Pane eventKey="data" style={{ textAlign: "left" }}>
                  <DataHelpPane />
                </Tab.Pane>
                <Tab.Pane eventKey="switch-cutout" style={{ textAlign: "left" }}>
                  <SwitchCutoutPane />
                </Tab.Pane>
                <Tab.Pane eventKey="stabilizer-cutout" style={{ textAlign: "left" }}>
                  <OtherCutoutPane />
                </Tab.Pane>
                <Tab.Pane eventKey="acoustic-cutout" style={{ textAlign: "left" }}>
                  <OtherCutoutPane />
                </Tab.Pane>
                <Tab.Pane eventKey="plate-settings" style={{ textAlign: "left" }}>
                  <OtherCutoutPane />
                </Tab.Pane>
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </Card>

      {/* 底部间距 */}
      <br />
    </Container>
  );
}

export default App;
