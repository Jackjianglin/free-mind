
/**
 * screen 固定大小
 *
 * k 放大比例
 * canvas = screen * k
 *
 * origin 画布在屏幕中心的坐标点
 * origin = origin * k + originOffset (应该是一个更复杂的式子，比如鼠标在屏幕右上角滑动滚轮，则更复杂。。)
 * originOffset 和 k 也有关系
 * node 的canvas position 和origin 没有关系
 * node 的screen position = canvasPosition - origin
 */

import React, { useState, useContext } from 'react';
import { GlobalContext } from '../util'
enum MouseDownType {
    Left, Right, Other
}
enum ComponentName {
    Node = "Node",
    Line = "Line",
    Container = "Container",
    Other = "Other"
}
interface IMouseDownInfo {
    mouseDownPosition: IPosition;
    mouseDownType: MouseDownType;
    mouseDownComponetName: ComponentName;
}
let _id = 0;
const getUniqueId = (): string => {
    return String(_id++)
}
const LinkCircle = ({ position, r }: { position: IPosition; r: number; }) => {
    const [active, setActive] = useState(false);
    return (
        <circle onMouseEnter={() => setActive(true)} onMouseLeave={() => setActive(false)}
            cx={position.x} cy={position.y} r={active ? r * 1.5 : r} stroke="black" stroke-width="1" fill="red" />
    )
}

const SVGComponent = ({ position, size }: { position: IPosition; size: ISize }) => {
    const { k, origin } = useContext(GlobalContext);
    const componentOffset = {
        x: (window.innerWidth / 2) - (origin.x - position.x * k) - (size.width / 2),
        y: (window.innerHeight / 2) - (origin.y - position.y * k) - (size.height / 2),
    }
    const componentSize = {
        width: size.width * k,
        height: size.height * k
    }
    const isHidden = (): boolean => {
        if (componentOffset.x > window.innerWidth && componentOffset.y > window.innerHeight) return true;
        if (componentOffset.x + componentSize.width < 0 && componentOffset.y + componentSize.height < 0) return true;
        return false;
    }

    return (
        isHidden()
            ?
            null
            :
            <svg {...componentSize} {...componentOffset} data-name={ComponentName.Node}>
                <rect {...componentSize} stroke="black" stroke-width="2" fill="gray" />
                <LinkCircle position={{ x: componentSize.width / 2, y: 0 }} r={5}></LinkCircle>
            </svg>
    )
}

const getComponentName = (node: HTMLElement | null): ComponentName => {
    if (node === null) return ComponentName.Other
    if (node.dataset.name) {
        const name = Object.keys(ComponentName).find(res => res === node.dataset.name)
        if (name) {
            return name as ComponentName
        }
    }
    return getComponentName(node.parentElement)
}

const getInitMouseDownInfo = (): IMouseDownInfo => {
    return {
        mouseDownPosition: { x: 0, y: 0 },
        mouseDownType: MouseDownType.Other,
        mouseDownComponetName: ComponentName.Other
    }
}
const getInitNodesConfig = (): ISVGNode[] => {
    return [
        {
            id: getUniqueId(),
            size: { width: 100, height: 60 },
            position: { x: 0, y: 0 },
            active: false
        },
    ]
}

export default () => {
    const [k, setK] = useState(1);
    const [size, setSize] = useState<ISize>({ width: window.innerWidth * k, height: window.innerHeight * k });
    const [originOffset, setOriginOffset] = useState<IPosition>({ x: 0, y: 0 })
    const getOrigin = (): IPosition => {
        return { x: ((size.width / 2) + originOffset.x) * k, y: ((size.height / 2) + originOffset.y) * k }
    }
    const [mouseDownInfo, setMouseDownInfo] = useState<IMouseDownInfo>(getInitMouseDownInfo());
    const [nodesConfig, setNodesConfig] = useState<ISVGNode[]>(getInitNodesConfig())
    return (
        <GlobalContext.Provider value={{ k, origin: getOrigin() }}>
            <svg style={{ width: window.innerWidth, height: window.innerHeight, cursor: mouseDownInfo.mouseDownType === MouseDownType.Right ? 'grab' : 'default' }}
                data-name={ComponentName.Container}
                onMouseDown={(e) => {
                    const mouseDownComponetName = getComponentName(e.target as HTMLElement);
                    let mouseDownType: MouseDownType = MouseDownType.Other;
                    if (e.button === 0) {
                        mouseDownType = MouseDownType.Left
                    }
                    else if (e.button === 2) {
                        mouseDownType = MouseDownType.Right;
                    };
                    setMouseDownInfo({
                        mouseDownPosition: {
                            x: e.clientX, y: e.clientY
                        },
                        mouseDownType,
                        mouseDownComponetName
                    })
                    e.preventDefault();
                }}
                onMouseUp={() => {
                    setMouseDownInfo(getInitMouseDownInfo())
                }}
                onMouseMove={(e) => {
                    if (mouseDownInfo.mouseDownType === MouseDownType.Other) return;
                    if (mouseDownInfo.mouseDownType === MouseDownType.Right) {
                        setOriginOffset({
                            x: originOffset.x - (e.movementX / k),
                            y: originOffset.y - (e.movementY / k)
                        })
                    }
                }}
                onContextMenu={(e) => {
                    e.preventDefault();
                }}
                onWheel={(e) => { if (e.deltaY < 0) { setK(k * 1.1) } else { setK(k * 0.9) } }}>
                {
                    nodesConfig.map(res => <SVGComponent key={res.id} {...res}></SVGComponent>)
                }
            </svg>
        </GlobalContext.Provider >
    )
};
