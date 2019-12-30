import React, { useState, useContext } from 'react';
import { GlobalContext } from '../../util'
import { ComponentLinkCirclePosition, ComponentName } from './constants'
import { getNodeStartPositionInScreen, computeNodeCirclePosition } from './util'

const LinkCircle = ({ position, r, direction, otherConfig }: { position: IPosition; r: number; direction: ComponentLinkCirclePosition; otherConfig?: { [x: string]: any } }) => {
    const [active, setActive] = useState(false);
    return (
        <circle {...otherConfig} data-direction={direction} onMouseEnter={() => setActive(true)} onMouseLeave={() => setActive(false)}
            cx={position.x} cy={position.y} r={active ? r * 1.5 : r} stroke="black" strokeWidth="1" fill="pink" />
    )
}
const getTextAreaStyle = (position: IPosition, size: ISize) => {
    return `resize:none; position: absolute; top: ${position.y}px; left: ${position.x}px; height: ${size.height}px; width: ${size.width}px;`
}

export default ({ id, position, size, active }: ISVGNode) => {
    const { k, origin, screenSize } = useContext(GlobalContext);
    const [text, setText] = useState('')
    // 获取在节点在屏幕上的原点位置, 起点位置，左上角
    const componentOffset = getNodeStartPositionInScreen(screenSize, origin, k, position, size)

    const componentSize = {
        width: size.width * k,
        height: size.height * k
    }
    const isHidden = (): boolean => {
        if (componentOffset.x > screenSize.width && componentOffset.y > screenSize.height) return true;
        if (componentOffset.x + componentSize.width < 0 && componentOffset.y + componentSize.height < 0) return true;
        return false;
    }
    const textSize = 18 * k;
    const generateTextarea = (e: React.MouseEvent) => {
        const textarea = document.createElement('textarea');
        textarea.setAttribute("style", getTextAreaStyle(componentOffset, componentSize));
        textarea.value = text
        textarea.onblur = () => {
            setText(textarea.value)
            document.body.removeChild(textarea);
        }
        document.body.appendChild(textarea);
        textarea.blur()
    }
    return (
        isHidden()
            ?
            null
            :
            <svg id={id} {...componentSize} {...componentOffset} data-name={ComponentName.Node}>
                <rect
                    onDoubleClick={(e) => {
                        generateTextarea(e);
                        e.preventDefault();
                    }} {...componentSize} stroke={active ? 'orange' : 'black'} strokeWidth={active ? 5 : 2} fill="gray" />
                <text x="10" style={{ fontSize: textSize }} y={(componentSize.height + (textSize / 2)) / 2} fill="red">{text}</text>
                <LinkCircle otherConfig={{

                }} direction={ComponentLinkCirclePosition.Left} position={computeNodeCirclePosition(ComponentLinkCirclePosition.Left, componentSize)} r={5}></LinkCircle>
                <LinkCircle direction={ComponentLinkCirclePosition.Right} position={computeNodeCirclePosition(ComponentLinkCirclePosition.Right, componentSize)} r={5}></LinkCircle>
            </svg>
    )
}