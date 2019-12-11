import React, { useState, useContext, useEffect } from 'react';
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

const SVGComponent = ({ position, size }: { position: IPosition; size: ISize }) => {
    const { k, origin } = useContext(GlobalContext);
    const componentOffset = {
        x: (position.x - (window.innerWidth / 2) + origin.x - (size.width / 2)) * k + origin.x,
        y: (position.y - (window.innerHeight / 2) + origin.y - (size.height / 2)) * k + origin.y
    }
    const componentSize = {
        width: size.width * k,
        height: size.height * k
    }
    return (
        <svg {...componentSize} {...componentOffset} data-name={ComponentName.Node}>
            <rect width="100%" height="100%" style={{ fill: 'gray', strokeWidth: 1, stroke: 'rgb(0,0,0)' }} />
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
interface IMouseDownInfo {
    offsetWithOrigin: IPosition;
    mouseDownType: MouseDownType;
    mouseDownComponetName: ComponentName;
}
const getInitMouseDownInfo = (): IMouseDownInfo => {
    return {
        offsetWithOrigin: { x: 0, y: 0 },
        mouseDownType: MouseDownType.Other,
        mouseDownComponetName: ComponentName.Other
    }
}
const someInfo = {
    startTime: new Date().valueOf(),
    renderCount: 0,
    moveTriggerCount: 0,
}
export default () => {
    const [k, setK] = useState(1);
    const [screenSize, setScreenSize] = useState<ISize>({ width: window.innerWidth, height: window.innerHeight });
    const [size, setSize] = useState<ISize>({ width: window.innerWidth * k, height: window.innerHeight * k });
    const [origin, setOrigin] = useState<IPosition>({ x: (size.width / 2), y: (size.height / 2) });
    const [mouseDownInfo, setMouseDownInfo] = useState<IMouseDownInfo>(getInitMouseDownInfo());

    const DebugSetting = ({ hidden }: { hidden: boolean }) => {
        if (hidden) return null;
        return (
            <div style={{ position: 'absolute', top: '0' }}>
                <button onClick={() => setOrigin({ x: origin.x + 100, y: origin.y })}>
                    +x(100)
                </button>
                <button onClick={() => setOrigin({ x: origin.x + 0, y: origin.y + 100 })}>
                    +y(100)
                </button>
                <button onClick={() => setOrigin({ x: origin.x - 100, y: origin.y })}>
                    -x(100)
                </button>
                <button onClick={() => setOrigin({ x: origin.x + 0, y: origin.y - 100 })}>
                    -y(100)
                </button>
            </div>
        )
    }
    someInfo.renderCount++;
    if (someInfo.renderCount === 1000 || someInfo.moveTriggerCount === 1000) {
        console.log(someInfo);
        
        console.log(new Date().valueOf() - someInfo.startTime);
    }
    return (
        <GlobalContext.Provider value={{ k, origin }}>
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
                        offsetWithOrigin: {
                            x: e.clientX - origin.x, y: e.clientY - origin.y
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
                    someInfo.moveTriggerCount++;
                    if (mouseDownInfo.mouseDownType === MouseDownType.Other) return;
                    if (mouseDownInfo.mouseDownType === MouseDownType.Right) {
                        setOrigin({
                            x: e.clientX - mouseDownInfo.offsetWithOrigin.x,
                            y: e.clientY - mouseDownInfo.offsetWithOrigin.y
                        })
                    }
                }}
                onContextMenu={(e) => {
                    e.preventDefault();
                }}
                onWheel={(e) => { if (e.deltaY < 0) { setK(k * 1.1) } else { setK(k * 0.9) } }}>
                <SVGComponent size={{ width: 100, height: 40 }} position={{ x: -window.innerWidth / 2, y: 0 }}></SVGComponent>
                <SVGComponent size={{ width: 100, height: 40 }} position={{ x: 0, y: 0 }}></SVGComponent>
                <SVGComponent size={{ width: 100, height: 40 }} position={{ x: window.innerWidth / 2, y: 0 }}></SVGComponent>
                <SVGComponent size={{ width: 100, height: 40 }} position={{ x: window.innerWidth, y: 0 }}></SVGComponent>
            </svg>
            {/* <DebugSetting hidden={false}></DebugSetting> */}
        </GlobalContext.Provider >

    )
};
