import React, { useEffect } from 'react'

const RC = React.createContext(null)

let heartbeat = null;

const RserveProvider = ({ value, children }) => {
    const [r, setR] = React.useState(null)
    const [isConnecting, setIsConnecting] = React.useState(false)

    const RSclient = require('./lib-rserve')

    React.useEffect(() => {
        if (!value.host) return;
        if (r && r.running) return;

        try {
            let s;
            const args = {
                ...value,
                on_connect: () => {
                    setIsConnecting(false)
                    console.log('connected')
                    setR(s)
                },
                on_close: () => {
                    setR(null)
                    console.log('disconnected, retrying connection ...')
                    setIsConnecting(true)
                    s = RSclient.create({ ...args })
                },
            }
            setIsConnecting(true)
            s = RSclient.create({ ...args })
        } catch (e) {
            setR(null)
            console.log(e)
        }
    }, [value, r])

    const checkPulse = () => {
        if (heartbeat !== null) clearInterval(heartbeat)

        heartbeat = setInterval(() => {
            if (r && r.running) {
                r.ocap((err, funs) => {
                    if (!funs.heartbeat) return 0;
                    return funs.heartbeat((err, value) => 0)
                })
            }
        }, [20000])
    }

    useEffect(() => {
        // send heartbeats
        checkPulse()
        return () => clearInterval(heartbeat)
    }, [r])

    return <RC.Provider value={{ R: r, connecting: isConnecting }}>{children}</RC.Provider>
}

export function useRserve() {
    return React.useContext(RC)
}

export const Rserve = ({ host, children }) => {
    return <RserveProvider value={{ host: host }}>{children}</RserveProvider>
}
