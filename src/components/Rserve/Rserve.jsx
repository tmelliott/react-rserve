import React, { useEffect } from 'react'

const RC = React.createContext(null)

const RserveProvider = ({ value, children }) => {
    const [r, setR] = React.useState(RC)

    const RSclient = require('./lib-rserve')

    useEffect(() => {
        if (!value.host) return

        try {
            const args = {
                ...value,
                on_connect: () => setR(s)
            }
            let s = RSclient.create({ ...args })
        } catch (e) {
            setR(null)
            console.log(e)
        }
    }, [value])

    return <RC.Provider value={r}>{children}</RC.Provider>
}

export function useRserve() {
    return React.useContext(RC)
}

export const Rserve = ({ host, children }) => {
    return <RserveProvider value={{ host: host }}>{children}</RserveProvider>
}
