import {type AnyRoute, createRoute, lazyRouteComponent} from "@tanstack/react-router";
import ERouterPath from "@shared/routes";

const createProjectPageRoute = (parentRoute: AnyRoute) =>
    createRoute({
        path: ERouterPath.PROJECT_PAGE,
        component: lazyRouteComponent(()=> import('../component/index.tsx')),
        getParentRoute: () => parentRoute,
    })

export {createProjectPageRoute}