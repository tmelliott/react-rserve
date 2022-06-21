import React, { useEffect } from 'react'

import { RSClient } from './lib-rserve'

const RC = React.createContext(null)

const RserveProvider = ({ value, children }) => {
    const [r, setR] = React.useState(RC)

    useEffect(() => {
        if (!value.host) return

        try {
            const args = {
                ...value,
                on_connect: () => setR(s)
            }
            let s = RSClient.create({ ...args })
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
