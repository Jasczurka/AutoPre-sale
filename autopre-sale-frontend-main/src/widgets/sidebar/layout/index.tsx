import {Sidebar} from "@widgets/sidebar/component";
import {Outlet} from "@tanstack/react-router";
import style from '../style/layout.module.css'
import {SidebarLayoutContext} from "@widgets/sidebar/case/context";
import {useState} from "react";


const SidebarLayout = () => {
    const [title, setTitle] = useState<string>('Def Title');

    return (
        <SidebarLayoutContext.Provider value={{title, setTitle}}>
            <div className={style.body}>
                <Sidebar/>
                <div className={style.main}>
                    <h1 className={style.title}>{title}</h1>
                    <div className={style.content}>
                        <Outlet/>
                    </div>
                </div>
            </div>
        </SidebarLayoutContext.Provider>

    )
}

export {SidebarLayout}