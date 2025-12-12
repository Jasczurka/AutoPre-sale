import { type AnyRoute, createRoute, lazyRouteComponent} from "@tanstack/react-router";
import ERouterPath from "@shared/routes";

const createAnalysisPageRoute = (parentRoute: AnyRoute) =>
    createRoute({
        path: ERouterPath.ANALYSIS,
        component: lazyRouteComponent(() => import('@pages/project_page/analysis-tz_page/component')),
        getParentRoute: () => parentRoute,
    })

export { createAnalysisPageRoute }