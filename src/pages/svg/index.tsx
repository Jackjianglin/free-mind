
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
import { GlobalContext, getUniqueId } from '../../util'
import SVGComponent from './node-component'
import SVGLine from './line-component'
import { ComponentName, ComponentLinkCirclePosition, EB_SVG_MOUSE_DOWN } from './constants'
import { getNodeStartPositionInScreen, computeNodeCirclePosition } from './util'
import { EventBus } from '../../util'

import { cloneDeep } from 'lodash'
enum MouseDownType {
    Left, Right, Other
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
let activeNodeMove = false; // 活跃的节点是否移动了


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
const WireFrame = ({ start, end }: { start: IPosition, end: IPosition }) => {
    const begin = {
        x: start.x < end.x ? start.x : end.x,
        y: start.y < end.y ? start.y : end.y,
    }
    const size = {
        height: Math.abs(end.y - start.y),
        width: Math.abs(end.x - start.x)
    }
    return <rect strokeDasharray='10' stroke='orange' fillOpacity={0} strokeWidth={2} {...begin}{...size} ></rect>
}
export default () => {
    const [k, setK] = useState(1);
    const [screenSize, setScreentSize] = useState<ISize>({ width: window.innerWidth, height: window.innerHeight });
    const [size, setSize] = useState<ISize>({ width: screenSize.width * k, height: screenSize.height * k });
    const [originOffset, setOriginOffset] = useState<IPosition>({ x: 0, y: 0 })
    const origin: IPosition = { x: ((size.width / 2) + originOffset.x) * k, y: ((size.height / 2) + originOffset.y) * k }
    const [mouseDownInfo, setMouseDownInfo] = useState<IMouseDownInfo>(getInitMouseDownInfo());
    const [nodesConfig, setNodesConfig] = useState<ISVGNode[]>(getInitNodesConfig());
    const [linesConfig, setLinesConfig] = useState<ISVGLine[]>([]);

    // 正在画的线
    const [moveingLinePosition, setMovingLinePosition] = useState<{ start: IPosition, end: IPosition } | null>(null);
    // 正在画的线框
    const [wireFrameConfig, setWireFrameConfig] = useState<{ start: IPosition, end: IPosition } | null>(null);

    const NodeActiveReset = () => {
        nodesConfig.forEach(res => {
            res.active = false;
        });
    }
    const getLinePosition = (lineConfig: ISVGLine): { start: IPosition, end: IPosition } | null => {
        const startNode = nodesConfig.find(res => res.id === lineConfig.start.nodeId)
        const endNode = nodesConfig.find(res => res.id === lineConfig.end.nodeId)
        if (!endNode) return null;
        if (!startNode) return null;

        const startOffset = getNodeStartPositionInScreen(screenSize, origin, k, startNode.position, startNode.size)
        const endOffset = getNodeStartPositionInScreen(screenSize, origin, k, endNode.position, endNode.size)

        const startCircleOffset = computeNodeCirclePosition(lineConfig.start.direction, startNode.size)
        const endCircleOffset = computeNodeCirclePosition(lineConfig.end.direction, endNode.size)

        let start = {
            x: startOffset.x + startCircleOffset.x,
            y: startOffset.y + startCircleOffset.y
        }
        let end = {
            x: endOffset.x + endCircleOffset.x,
            y: endOffset.y + endCircleOffset.y
        }
        return {
            start,
            end
        }
    }
    const cloneNodeConfig = (node: ISVGNode): ISVGNode => {
        const newNode = cloneDeep(node)
        newNode.id = getUniqueId()
        return newNode
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
            NodeActiveReset()
            node.active = !currentValue;
            setNodesConfig([...nodesConfig])
        }
    }
    // 遍历节点，在虚线框内的矩形激活
    const setNodesActiveInRect = ({ start, end }: { start: IPosition, end: IPosition }) => {
        const wireFrameStart = start
        const wireFrameEnd = end
        if (wireFrameStart.x > wireFrameEnd.x) {
            [wireFrameStart.x, wireFrameEnd.x] = [wireFrameEnd.x, wireFrameStart.x]
        }
        if (wireFrameStart.y > wireFrameEnd.y) {
            [wireFrameStart.y, wireFrameEnd.y] = [wireFrameEnd.y, wireFrameStart.y]
        }
        nodesConfig.forEach(node => {
            const nodeStart = getNodeStartPositionInScreen(screenSize, origin, k, node.position, node.size);
            const nodeEnd = {
                x: nodeStart.x + node.size.width,
                y: nodeStart.y + node.size.height
            }
            // 相交矩形
            const intersectRect = {
                start: {
                    x: Math.max(nodeStart.x, wireFrameStart.x),
                    y: Math.max(nodeStart.y, wireFrameStart.y),
                },
                end: {
                    x: Math.min(nodeEnd.x, wireFrameEnd.x),
                    y: Math.min(nodeEnd.y, wireFrameEnd.y),
                }
            }
            if (intersectRect.end.x > intersectRect.start.x && intersectRect.end.y > intersectRect.start.y) {
                // 相交成功
                node.active = true;
            }
        })
        setNodesConfig([...nodesConfig])
    }
    return (
        <GlobalContext.Provider value={{ k, origin, screenSize }}>
            <svg style={{ ...screenSize, cursor: mouseDownInfo.mouseDownType === MouseDownType.Right ? 'grab' : 'default' }}
                data-name={ComponentName.Container}
                // onClick={(e) => {
                //     // 鼠标点击时的操作，用于激活选中节点
                //     const { name, id } = getComponentName(e.target as HTMLElement);
                //     if (!activeNodeMove) {
                //         switch (name) {
                //             case ComponentName.Node:
                //                 NodeClick(id || '', !e.ctrlKey);
                //                 break;
                //             case ComponentName.Container:
                //                 NodeActiveReset();
                //                 setNodesConfig([...nodesConfig])
                //                 break;
                //         }
                //     }
                //     activeNodeMove = false;
                // }}
                onMouseDown={(e) => {
                    EventBus.emit(EB_SVG_MOUSE_DOWN)
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
                    // 如果要连接两个节点
                    let nodeCircleDirection = undefined;
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
                    // 如果要生成新节点
                    if (componet.name === ComponentName.Container && mouseDownInfo.nodeCircleDirection) {
                        const startPosition: IPosition = mouseDownInfo.mouseDownPosition;
                        const endPostion: IPosition = {
                            x: e.clientX,
                            y: e.clientY
                        }
                        const direction = Math.sqrt((startPosition.x - endPostion.x) * (startPosition.x - endPostion.x) + (startPosition.y - endPostion.y) * (startPosition.y - endPostion.y))
                        if (direction > 50) {
                            const startNode = nodesConfig.find(res => res.id === mouseDownInfo.componet.id)
                            if (!startNode) return;

                            const newNode = cloneNodeConfig(startNode);
                            // 新节点的相对位置
                            newNode.position.y = startNode.position.y + (e.clientY - mouseDownInfo.mouseDownPosition.y);
                            newNode.position.x = startNode.position.x + (e.clientX - mouseDownInfo.mouseDownPosition.x);
                            const endNodeDirection: ComponentLinkCirclePosition = newNode.position.x > startNode.position.x ? ComponentLinkCirclePosition.Left : ComponentLinkCirclePosition.Right
                            // 细调节点位置
                            if (endNodeDirection === ComponentLinkCirclePosition.Left) {
                                newNode.position.x += startNode.size.width
                            } else if (endNodeDirection === ComponentLinkCirclePosition.Right) {
                                newNode.position.x -= startNode.size.width
                            }
                            setNodesConfig([...nodesConfig, newNode])
                            const lineConfig: ISVGLine = {
                                id: getUniqueId(),
                                start: {
                                    nodeId: startNode.id,
                                    direction: mouseDownInfo.nodeCircleDirection
                                },
                                end: {
                                    nodeId: newNode.id,
                                    direction: endNodeDirection
                                }
                            }
                            setLinesConfig([...linesConfig, lineConfig])
                        }
                    }
                    if (wireFrameConfig) {
                        setNodesActiveInRect(wireFrameConfig);
                    }
                    setMovingLinePosition(null);
                    setWireFrameConfig(null);
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
                        if (mouseDownInfo.componet.name === ComponentName.Container) {

                        }
                        // 点击的是node 上的小圆圈
                        if (mouseDownInfo.nodeCircleDirection) {
                            setMovingLinePosition({
                                start: mouseDownInfo.mouseDownPosition,
                                end: {
                                    x: e.clientX, y: e.clientY
                                }
                            })
                        } else {
                            // 如果有选中的节点，移动节点位置
                            const activeNodes = nodesConfig.filter(res => res.active);
                            if (activeNodes.length > 0) {
                                activeNodeMove = true;
                                activeNodes.forEach(res => {
                                    res.position = {
                                        x: res.position.x + (e.movementX / k),
                                        y: res.position.y + (e.movementY / k)
                                    }
                                });
                                setNodesConfig([...nodesConfig])
                            } else {
                                // 画出线框
                                setWireFrameConfig({
                                    start: mouseDownInfo.mouseDownPosition,
                                    end: {
                                        x: e.clientX, y: e.clientY
                                    }
                                })
                            }
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
                    wireFrameConfig ? <WireFrame {...wireFrameConfig}></WireFrame> : null
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
