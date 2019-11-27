import React, { Component, useState, useContext } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';
import Konva from 'konva';
import { AppContext } from '../App'
export default ({ position }: { position: { x: number; y: number } }) => {
    const k = useContext(AppContext);
    const [active, setActive] = useState(false)
    return (
        <Rect
            draggable
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
