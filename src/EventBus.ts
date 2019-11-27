type IMethod = (data: any) => void
let methods: { [x: string]: IMethod } = {}
const Bus = {
    emit(key: string, data: any) {
        if (methods[key] instanceof Function) {
            methods[key](data)
        }
    },
    on(key: string, method: IMethod) {
        if (methods[key] === undefined) {
            methods[key] = method;
        } else {
            methods[key] = method;
        }
    }
}

export default Bus;