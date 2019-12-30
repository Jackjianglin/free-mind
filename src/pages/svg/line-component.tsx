import React, { useState, useContext } from 'react';
export default ({ start, end }: { start: IPosition; end: IPosition }) => {
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