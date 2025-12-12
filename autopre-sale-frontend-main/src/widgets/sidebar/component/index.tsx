import style from '../style/sidebar.module.css'
import {SmallLogo} from "@shared/components/images/SmallLogo.tsx";
import Icon from "@mdi/react";
import {ICON_PATH} from "@shared/components/images/icons";
import {cn} from "@shared/lib/cn";
import {Link, useParams} from "@tanstack/react-router";
import ERouterPath from "@shared/routes";
import {useSignOutRequest} from "@entities/user/auth/use-case/sing-out";
import {useAuth} from "@entities/user/auth/context/useAuth.ts";

interface ISidebarItemProps {
    icon?: string;
    name?: string;
    active?: boolean;
    path?: string
}

const SidebarItem = ({
    icon = ICON_PATH.FOLDER_COPY,
    name = "Проекты",
    active,
    path = ERouterPath.PROJECTS_PAGE
 }:ISidebarItemProps) => {
    return (
        <Link to={path} className={cn(style.sidebarOption, active ? style.active : '')}>
            <Icon path={icon} size={1} className={style.icon}/>
            {name}
        </Link>
    )
}

const Sidebar = () => {
    const {projectId} = useParams({
        strict: false,
    })

    const { mutate: signOut, isPending } = useSignOutRequest();
    const {user} = useAuth();

    const handleSignOut = () => {
        signOut();
    };

    return (
        <div className={style.sidebar}>
            <nav className={style.content}>
                <SmallLogo/>
                <div className={'flex flex-col gap-[5px] w-full h-fit '}>
                    <SidebarItem
                        path={ERouterPath.PROJECTS_PAGE}
                        icon={ICON_PATH.FOLDER_COPY}
                        name={'Проекты'}/>
                    {projectId && (
                        <>
                            <div className={'h-[2px] w-[185px] bg-gray-400 mx-auto mt-[5px] mb-[12px] select-none'}/>
                            <SidebarItem
                                path={ERouterPath.PROJECT + '/' + projectId + ERouterPath.ANALYSIS}
                                icon={ICON_PATH.ANALYSIS}
                                name={'Анализ ТЗ'}/>
                            <SidebarItem
                                path={ERouterPath.PROJECT + '/' + projectId + ERouterPath.CONSTRUCTOR}
                                icon={ICON_PATH.DESCRIPTION}
                                name={'Конструктор ТКП'}/>
                        </>
                    )}
                </div>
            </nav>
            <div className={'flex flex-col gap-[15px]'}>
                <p className={'pl-[15px]'}>Вход: {user?.fullName}</p>
                <button className={style.sidebarOption} onClick={handleSignOut} disabled={isPending}>
                    <Icon path={ICON_PATH.LOGOUT} size={1}/>
                    Выход
                </button>
            </div>
        </div>
    )
}

export {Sidebar}