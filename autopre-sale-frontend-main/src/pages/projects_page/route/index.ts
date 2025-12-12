import { type AnyRoute, createRoute, lazyRouteComponent} from "@tanstack/react-router";
import ERouterPath from "@shared/routes";

const createProjectsPageRoute = (parentRoute: AnyRoute) =>
    createRoute({
        path: ERouterPath.PROJECTS_PAGE,
        component: lazyRouteComponent(() => import('@pages/projects_page/component')),
        getParentRoute: () => parentRoute,
    })

export { createProjectsPageRoute }