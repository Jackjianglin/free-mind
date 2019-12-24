interface ISize {
    width: number;
    height: number;
}
interface IPosition {
    x: number;
    y: number;
}

interface IGlobal {
    k: number;
    origin: IPosition;
}

interface ISVGNode {
    id: string;
    size: ISize;
    position: IPosition;
    active: boolean;
}
