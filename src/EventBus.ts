type IMethod = (data: any) => void
let methods: { [x: string]: IMethod[] } = {}
const Bus = {
    emit(key: string, data: any) {
        if (methods[key] instanceof Array) {
            methods[key].forEach(res => res((data)))
        }
    },
    on(key: string, method: IMethod) {
        if (methods[key] === undefined) {
            methods[key] = [method];
        } else {
            methods[key].push(method);
        }
    },
    un(key: string, method: IMethod) {
        if (methods[key] === undefined) {
            return;
        } else {
            const index = methods[key].findIndex(res => res === method);
            if (index > -1) {
                methods[key].splice(index, 1)
            }
        }
    }
}

export default Bus;