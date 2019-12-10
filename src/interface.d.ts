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
    updateOrigin: (position: IPosition) => void
}