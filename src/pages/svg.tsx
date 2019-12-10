import React, { useState, useContext, useEffect } from 'react';
import { GlobalContext } from '../util'
const SVGComponent = ({ position, size }: { position: IPosition; size: ISize }) => {
    const { k, origin, updateOrigin } = useContext(GlobalContext);
    const componentOffset = {
        x: (position.x - (window.innerWidth / 2) + origin.x - (size.width / 2)) * k + origin.x,
        y: (position.y - (window.innerHeight / 2) + origin.y - (size.height / 2)) * k + origin.y
    }
    return (
        <svg onDoubleClick={(...e) => { updateOrigin(position) }}
            width={size.width * k}
            height={size.height * k}
            {...componentOffset}
        >
            <rect width="100%" height="100%" style={{ fill: 'gray', strokeWidth: 1, stroke: 'rgb(0,0,0)' }} />
        </svg>
    )
}
enum MouseClickType {
    Left, Right, null
}

export default () => {
    const [k, setK] = useState(1);
    const [screenSize, setScreenSize] = useState<ISize>({ width: window.innerWidth, height: window.innerHeight });
    const [size, setSize] = useState<ISize>({ width: window.innerWidth * k, height: window.innerHeight * k });
    const [origin, setOrigin] = useState<IPosition>({ x: (size.width / 2), y: (size.height / 2) });
    const [mouseDownType, setMouseDownType] = useState<MouseClickType>(MouseClickType.null);
    const [lastMousePosition, setLastMousePosition] = useState<IPosition | null>(null);

    const updateOrigin = (position: IPosition) => {
        setOrigin({
            x: (window.innerWidth / 2) - position.x,
            y: (window.innerHeight / 2) - position.y
        })
    }
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
    return (
        <GlobalContext.Provider value={{ k, origin, updateOrigin }}>
            <svg style={{ width: window.innerWidth, height: window.innerHeight, cursor: mouseDownType === MouseClickType.Right ? 'grab' : 'default' }}
                onMouseDown={(e) => {
                    if (e.button === 0) {
                        setMouseDownType(MouseClickType.Left)
                    }
                    else if (e.button === 2) {
                        setMouseDownType(MouseClickType.Right)
                    }
                    e.preventDefault();
                }}
                onMouseUp={() => {
                    setMouseDownType(MouseClickType.null);
                    setLastMousePosition(null)
                }}
                onMouseMove={(e) => {
                    if (mouseDownType === MouseClickType.null) return;
                    let move: IPosition = { x: 0, y: 0 }
                    if (lastMousePosition !== null) {
                        move = {
                            x: e.clientX - lastMousePosition.x,
                            y: e.clientY - lastMousePosition.y
                        }
                    }
                    setLastMousePosition({
                        x: e.clientX, y: e.clientY
                    })
                    setOrigin({
                        x: move.x / (k > 1 ? k : 1) + origin.x,
                        y: move.y / (k > 1 ? k : 1) + origin.y
                    })
                    console.log(move)
                }}
                onContextMenu={(e) => {
                    e.preventDefault();
                }}
                onWheel={(e) => { if (e.deltaY < 0) { setK(k * 1.1) } else { setK(k * 0.9) } }}>
                <SVGComponent size={{ width: 100, height: 40 }} position={{ x: -50, y: -50 }}></SVGComponent>
                <SVGComponent size={{ width: 100, height: 40 }} position={{ x: 50, y: 50 }}></SVGComponent>
            </svg>
            {/* <DebugSetting hidden={false}></DebugSetting> */}
        </GlobalContext.Provider >

    )
};
