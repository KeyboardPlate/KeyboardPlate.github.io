export function DataHelpPane() {

    // _rs: 独立于按键旋转稳定器（对底排稳定器有用）
    // _rc: 独立于按键旋转轴体切口
    // _ss: 移位稳定器（主要用于6U偏心）。false = 未移位（默认），true = 移位
    // _so: 跳过自动方向修正
    //      默认情况下，定位板生成器会自动旋转垂直高的轴体，使其被视为旋转90度的宽按键
    //      设置 _so: true 将跳过此修正

    return (
        <div>
            <h2>自定义数据</h2>
            <p>定位板生成器提供了一些额外的选项来调整定位板输出。<br />
                这些可以作为类似于 <code>{`{w:Width}`}</code> 的 KLE 标志添加到输入的 KLE 数据中。</p>
            <p>例如，要添加 <code>_rs: 180</code> 标志来旋转底排空格键稳定器，首先找到现有的 <code>w:6.25</code> 或类似的空格键修饰符，然后以典型的 JSON 方式添加标志。<br />
                完成后的结果应该类似于 <code>{`{w:6.25,_rs:180}`}</code>。</p>
            <br />
            <h3>可用的定位板生成器标志</h3>
            <br />
            <h4 style={{ textTransform: "lowercase" }}>_rs</h4>
            <p>值类型：数值</p>
            <p>独立于按键按指定角度旋转稳定器。</p>
            <br />
            <h4 style={{ textTransform: "lowercase" }}>_rc</h4>
            <p>值类型：数值</p>
            <p>独立于其所在的旋转集群按指定角度旋转轴体切口。</p>
            <br />
            <h4 style={{ textTransform: "lowercase" }}>_ss</h4>
            <p>值类型：布尔值</p>
            <p>切换移位稳定器以启用偏心 6U 稳定器。</p>
            <br />
            <h4 style={{ textTransform: "lowercase" }}>_so</h4>
            <p>值类型：布尔值</p>
            <p>切换自动方向修正。
                默认情况下，当按键高度大于宽度时，定位板生成器会自动旋转轴体切口并添加稳定器。
            </p>
        </div>
    )
}

export function SwitchCutoutPane() {

    return (
        <div>
            <h2>轴体切口类型</h2>
            <br />
            <h4>Cherry MAX</h4>
            <p>14 x 14 mm</p>
            <p>为 Cherry MX 基础轴体切口添加圆角狗骨。</p>
            <br />
            <h4>Cherry MX 基础</h4>
            <p>14 x 14 mm</p>
            <p>现代 MX 风格轴体的标准轴体切口。</p>
            <br />
            <h4>Alps SKCM/L</h4>
            <p>15.5 x 12.8 mm</p>
            <p>适用于 Alps SKCM 和 SKCL 系列轴体。</p>
            <br />
            <h4>Choc CPG1350</h4>
            <p>14 x 14mm</p>
            <p>适用于行程距离为 3.0mm 的 Kailh Choc V1 CPG1350 轴体。<br />
            与基础 Cherry MX 轴体的切口相同。</p>
            <br />
            <h4>Mini Choc CPG1232</h4>
            <p>13.7 x 12.7 mm</p>
            <p>适用于 Choc CPG1232 轴体，由 Kailh 销售为 "Mini Choc"。<br />
                行程距离为 2.4mm。</p>
            <br />
            <h4>Omron B3G/B3G-S</h4>
            <p>13.5 x 13.5 mm</p>
            <p>适用于 Omron B3G 和 B3G-S 系列轴体。</p>
            <br />
            <h4>Alps SKCP</h4>
            <p>16 x 16 mm</p>
            <p>适用于 Alps SKCP 系列轴体。</p>
            <br />
            <h4>Hi-Tek 725</h4>
            <p>15.621 x 15.621 mm (0.615 in)</p>
            <p>适用于 NMB Hi-Tek 725 轴体。</p>
            <br />
            <h4>i-Rocks</h4>
            <p>15.8 x 13.4 mm</p>
            <p>适用于 i-Rocks 机械轴体。</p>
            <br />
            <h4>Futaba MA</h4>
            <p>14 x 15 mm</p>
            <p>适用于 Futaba MA 机械轴体。</p>
            
        </div>
    )
}

export function OtherCutoutPane() {

    return (
        <div>
            <h2>稳定器切口类型</h2>
            <br />
            <h4>Cherry MX 基础</h4>
            <p>适用于大多数场合的典型切口。</p>
            <br />
            <h4>Cherry MX 紧密配合</h4>
            <p>更小的切口，紧密贴合 Cherry MX 规格稳定器。<br />
                可能不适合超大尺寸的第三方稳定器。</p>
            <br />
            <h4>Cherry MX 规格</h4>
            <p>Cherry MX 数据表指定的精确稳定器切口。<br />
                由于其复杂的形状和紧密配合，圆角半径应该非常小或为 0。</p>
            <br />
            <h4>Alps AEK</h4>
            <p>适用于 AEK 稳定器尺寸的 Alps 专用稳定器。</p>
            <br />
            <h4>Alps AT101</h4>
            <p>适用于 AT101 稳定器尺寸的 Alps 专用稳定器。</p>
            <br />
            <h2>声学切口类型</h2>
            <br />
            <h4>Cherry MX 基础</h4>
            <p>适量的声学切口。</p>
            <br />
            <h4>Cherry MX 极限</h4>
            <p>大量的声学切口。</p>
        </div>
    )
}
