import { ComponentLinkCirclePosition } from './constants'

export const name = 'util.ts'

export const canvasPosition2ScreenPosition = (screenSize: ISize, origin: IPosition, k: number, canvasPosition: IPosition): IPosition => {
    return {
        x: (screenSize.width / 2) - (origin.x - canvasPosition.x * k),
        y: (screenSize.height / 2) - (origin.y - canvasPosition.y * k),
    }
}


export const getNodeStartPositionInScreen = (screenSize: ISize, origin: IPosition, k: number, canvasPosition: IPosition, nodeSize: ISize): IPosition => {
    const originPosition = canvasPosition2ScreenPosition(screenSize, origin, k, canvasPosition)
    return {
        x: originPosition.x - (nodeSize.width / 2),
        y: originPosition.y - (nodeSize.height / 2),
    }
}

export const computeNodeCirclePosition = (direction: ComponentLinkCirclePosition, nodeSize: ISize): IPosition => {
    switch (direction) {
        case ComponentLinkCirclePosition.Left:
            return { x: 5, y: nodeSize.height / 2 };
        case ComponentLinkCirclePosition.Right:
            return { x: nodeSize.width - 5, y: nodeSize.height / 2 }
        default:
            return { x: 0, y: 0 }
    }
}