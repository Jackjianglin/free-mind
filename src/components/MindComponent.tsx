import React, { useState, useContext } from 'react';
import { Rect, Text } from 'react-konva';
import Konva from 'konva';
import EventBus from '../EventBus'
export default ({ id, position }: { id: string, position: { x: number; y: number } }) => {
    const [active, setActive] = useState(false)
    return (
        <Rect
            draggable
            onMouseUp={(e) => {
                EventBus.emit('updateNodeData', {
                    id,
                    position: { x: e.evt.x, y: e.evt.y }
                });
            }}
            width={20}
            height={20}
            fill={Konva.Util.getRandomColor()}
            shadowBlur={3}
            stroke={active ? 'black' : 'white'}
            onClick={() => setActive(true)}
            {...position}
        />
    );
}
