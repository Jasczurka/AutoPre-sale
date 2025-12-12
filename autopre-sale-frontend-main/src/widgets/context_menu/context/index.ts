import { createContext } from 'react'
import type { IContextMenuContextProps } from '../interface'

const ContextMenuContext = createContext<IContextMenuContextProps | undefined>(undefined)

export { ContextMenuContext }
