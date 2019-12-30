import React from 'react'

let _id = 0;
export const getUniqueId = () => String(_id++)

type IMethod = (data: any) => void
let methods: { [x: string]: IMethod[] } = {}
export const EventBus = {
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



export const GlobalContext = React.createContext<IGlobal>({
    k: 1,
    origin: { x: 0, y: 0 },
    screenSize: {
        width: window.innerWidth,
        height: window.innerHeight
    }
})

