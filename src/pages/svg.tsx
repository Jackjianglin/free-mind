
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
enum ComponentLinkCirclePosition {
    Top = "Top", Right = "Right", Bottom = "Bottom", Left = "Left"
}
interface ISVGLine {
    id: string;
    start: {
        nodeId: string,
        direction: ComponentLinkCirclePosition
    };
    end: {
        nodeId: string,
        direction: ComponentLinkCirclePosition
    }
}
interface IMouseDownInfo {
    mouseDownPosition: IPosition;
    mouseDownType: MouseDownType;
    componet: {
        name: ComponentName,
        id: string
    };
    nodeCircleDirection?: ComponentLinkCirclePosition
}
let _id = 0;
let activeNodeMove = false; // 活跃的节点是否移动了
const getUniqueId = (): string => {
    return String(_id++)
}
const LinkCircle = ({ position, r, direction }: { position: IPosition; r: number; direction: ComponentLinkCirclePosition }) => {
    const [active, setActive] = useState(false);
    return (
        <circle data-direction={direction} onMouseEnter={() => setActive(true)} onMouseLeave={() => setActive(false)}
            cx={position.x} cy={position.y} r={active ? r * 1.5 : r} stroke="black" strokeWidth="1" fill="pink" />
    )
}

const SVGComponent = ({ id, position, size, active }: ISVGNode) => {
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
            <svg id={id} {...componentSize} {...componentOffset} data-name={ComponentName.Node}>
                <rect {...componentSize} stroke={active ? 'orange' : 'black'} strokeWidth={active ? 5 : 2} fill="gray" />
                <LinkCircle direction={ComponentLinkCirclePosition.Left} position={{ x: 5, y: componentSize.height / 2 }} r={5}></LinkCircle>
                <LinkCircle direction={ComponentLinkCirclePosition.Right} position={{ x: componentSize.width - 5, y: componentSize.height / 2 }} r={5}></LinkCircle>
            </svg>
    )
}

const SVGLine = ({ start, end }: { start: IPosition; end: IPosition }) => {
    const middleY = (end.y + start.y) / 2;
    const middleX = (end.x + start.x) / 2;


    /**
     * 解决鼠标moveup 时的target 是path 问题
     */
    if (end.x > start.x) {
        end.x -= 1;
    } else {
        end.x += 1
    }
    if (end.y > start.y) {
        end.y -= 1;
    } else {
        end.y += 1
    }


    const path = `M ${start.x} ${start.y} C ${middleX} ${start.y} ${middleX} ${start.y} ${middleX} ${middleY} S ${middleX} ${end.y} ${end.x} ${end.y}`;
    return (
        <path d={path} stroke="black" fill="transparent" />
    )
}
const getComponentName = (node: HTMLElement | null): { name: ComponentName, id: string } => {
    if (node === null) return {
        name: ComponentName.Other,
        id: '-1'
    }
    if (node.dataset.name) {
        const name = Object.keys(ComponentName).find(res => res === node.dataset.name)
        if (name) {
            return {
                name: name as ComponentName,
                id: node.getAttribute("id") as string
            }
        }
    }
    return getComponentName(node.parentElement)
}

const getInitMouseDownInfo = (): IMouseDownInfo => {
    return {
        mouseDownPosition: { x: 0, y: 0 },
        mouseDownType: MouseDownType.Other,
        componet: {
            name: ComponentName.Other,
            id: '-1'
        },
        nodeCircleDirection: undefined
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
        {
            id: getUniqueId(),
            size: { width: 100, height: 60 },
            position: { x: 200, y: 0 },
            active: false
        },
    ]
}

export default () => {
    const [k, setK] = useState(1);
    const [size, setSize] = useState<ISize>({ width: window.innerWidth * k, height: window.innerHeight * k });
    const [originOffset, setOriginOffset] = useState<IPosition>({ x: 0, y: 0 })
    const [moveingLinePosition, setMovingLinePosition] = useState<{ start: IPosition, end: IPosition } | null>(null);
    const origin: IPosition = { x: ((size.width / 2) + originOffset.x) * k, y: ((size.height / 2) + originOffset.y) * k }

    const [mouseDownInfo, setMouseDownInfo] = useState<IMouseDownInfo>(getInitMouseDownInfo());
    const [nodesConfig, setNodesConfig] = useState<ISVGNode[]>(getInitNodesConfig());
    const [linesConfig, setLinesConfig] = useState<ISVGLine[]>([]);
    const NodeReset = () => {
        nodesConfig.forEach(res => {
            res.active = false;
        });
    }
    const getLinePosition = (lineConfig: ISVGLine): { start: IPosition, end: IPosition } | null => {
        const startNode = nodesConfig.find(res => res.id === lineConfig.start.nodeId)
        const endNode = nodesConfig.find(res => res.id === lineConfig.end.nodeId)
        if (!endNode) return null;
        if (!startNode) return null;
        const startOffset = {
            x: (window.innerWidth / 2) - (origin.x - startNode.position.x * k) - (startNode.size.width / 2),
            y: (window.innerHeight / 2) - (origin.y - startNode.position.y * k) - (startNode.size.height / 2),
        }
        const endOffset = {
            x: (window.innerWidth / 2) - (origin.x - endNode.position.x * k) - (endNode.size.width / 2),
            y: (window.innerHeight / 2) - (origin.y - endNode.position.y * k) - (endNode.size.height / 2),
        }
        // { x: 5, y: componentSize.height / 2 }
        // { x: componentSize.width - 5, y: componentSize.height / 2 }
        let start = {
            x: startOffset.x,
            y: startOffset.y
        }
        let end = {
            x: endOffset.x,
            y: endOffset.y
        }
        if (lineConfig.start.direction === ComponentLinkCirclePosition.Right) {
            start.x += (startNode.size.width - 5)
            start.y += (startNode.size.height / 2)
        } else if (lineConfig.start.direction === ComponentLinkCirclePosition.Left) {
            start.x += 5
            start.y += (startNode.size.height / 2)
        }

        if (lineConfig.end.direction === ComponentLinkCirclePosition.Right) {
            end.x += (endNode.size.width - 5)
            end.y += (endNode.size.height / 2)
        } else if (lineConfig.end.direction === ComponentLinkCirclePosition.Left) {
            end.x += 5
            end.y += (endNode.size.height / 2)
        }
        return {
            start,
            end: end
        }
    }
    const NodeClick = (id: string, otherRest: boolean = true) => {
        if (otherRest === false) {
            const node = nodesConfig.find(res => res.id === id)
            if (!node) return;
            node.active = !node.active;
            setNodesConfig([...nodesConfig])
        } else {
            const node = nodesConfig.find(res => res.id === id)
            if (!node) return;
            const currentValue = node.active;
            NodeReset()
            node.active = !currentValue;
            setNodesConfig([...nodesConfig])
        }
    }
    return (
        <GlobalContext.Provider value={{ k, origin }}>
            <svg style={{ width: window.innerWidth, height: window.innerHeight, cursor: mouseDownInfo.mouseDownType === MouseDownType.Right ? 'grab' : 'default' }}
                data-name={ComponentName.Container}
                onClick={(e) => {
                    // 鼠标点击时的操作，用于激活选中节点
                    const { name, id } = getComponentName(e.target as HTMLElement);
                    if (!activeNodeMove) {
                        switch (name) {
                            case ComponentName.Node:
                                NodeClick(id || '', !e.ctrlKey);
                                break;
                            case ComponentName.Container:
                                NodeReset();
                                setNodesConfig([...nodesConfig])
                                break;
                        }
                    }
                    activeNodeMove = false;
                }}
                onMouseDown={(e) => {
                    // 获取鼠标点击时的信息
                    const componet = getComponentName(e.target as HTMLElement);
                    let mouseDownType: MouseDownType = MouseDownType.Other;

                    // 如果点击的是节点上的小圆圈
                    let nodeCircleDirection = undefined;
                    if (componet.name === ComponentName.Node && (e.target as HTMLElement).tagName === 'circle') {
                        const key = Object.keys(ComponentLinkCirclePosition).find(res => res === (e.target as HTMLElement).dataset.direction)
                        nodeCircleDirection = key ? (key as ComponentLinkCirclePosition) : undefined;
                    }

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
                        componet,
                        nodeCircleDirection
                    })
                    e.preventDefault();
                }}
                onMouseUp={(e) => {
                    const componet = getComponentName(e.target as HTMLElement);
                    // 如果点击的是节点上的小圆圈
                    let nodeCircleDirection = undefined;
                    // componet.name === container
                    if ((componet.name === ComponentName.Node) &&
                        ((e.target as HTMLElement).tagName === 'circle') &&
                        (mouseDownInfo.componet.name === ComponentName.Node) &&
                        mouseDownInfo.nodeCircleDirection &&
                        (componet.id !== mouseDownInfo.componet.id)) {

                        const key = Object.keys(ComponentLinkCirclePosition).find(res => res === (e.target as HTMLElement).dataset.direction)
                        nodeCircleDirection = key ? (key as ComponentLinkCirclePosition) : undefined;
                        const lineConfig: ISVGLine = {
                            id: getUniqueId(),
                            start: {
                                nodeId: mouseDownInfo.componet.id,
                                direction: mouseDownInfo.nodeCircleDirection
                            },
                            end: {
                                nodeId: componet.id,
                                direction: nodeCircleDirection as ComponentLinkCirclePosition
                            }
                        }
                        setLinesConfig([...linesConfig, lineConfig])
                    }

                    setMovingLinePosition(null);
                    setMouseDownInfo(getInitMouseDownInfo())
                }}
                onMouseMove={(e) => {
                    if (mouseDownInfo.mouseDownType === MouseDownType.Other) return;
                    if (mouseDownInfo.mouseDownType === MouseDownType.Right) {
                        // 拖拽视图
                        setOriginOffset({
                            x: originOffset.x - (e.movementX / k),
                            y: originOffset.y - (e.movementY / k)
                        })
                    }
                    if (mouseDownInfo.mouseDownType === MouseDownType.Left) {
                        if (mouseDownInfo.nodeCircleDirection) {
                            setMovingLinePosition({
                                start: mouseDownInfo.mouseDownPosition,
                                end: {
                                    x: e.clientX, y: e.clientY
                                }
                            })
                        } else {
                            // 如果有选中的节点，移动节点位置
                            activeNodeMove = true;
                            const activeNodes = nodesConfig.filter(res => res.active);
                            activeNodes.forEach(res => {
                                res.position = {
                                    x: res.position.x + (e.movementX / k),
                                    y: res.position.y + (e.movementY / k)
                                }
                            });
                            setNodesConfig([...nodesConfig])
                        }
                    }
                }}
                onContextMenu={(e) => {
                    e.preventDefault();
                }}
                onWheel={(e) => { if (e.deltaY < 0) { setK(k * 1.1) } else { setK(k * 0.9) } }}>
                {
                    nodesConfig.map(res => <SVGComponent key={res.id} {...res}></SVGComponent>)
                }
                {
                    moveingLinePosition ? <SVGLine {...moveingLinePosition}></SVGLine> : null
                }
                {
                    linesConfig.map(res => {
                        const lineOffsetConfig = getLinePosition(res)
                        if (lineOffsetConfig) {
                            return <SVGLine key={res.id} {...lineOffsetConfig}></SVGLine>
                        }
                        return null;
                    })
                }
            </svg>
        </GlobalContext.Provider >
    )
};
