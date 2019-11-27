interface IPosition {
    x: number;
    y: number;
}
interface ISize {
    width: number;
    height: number;
}
interface INode {
    id: string;
    position: IPosition;
    size: ISize;
    active: boolean;
}