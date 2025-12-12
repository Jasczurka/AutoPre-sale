import { type AnyRoute, createRoute, lazyRouteComponent} from "@tanstack/react-router";
import ERouterPath from "@shared/routes";

const createTestPageRoute = (parentRoute: AnyRoute) =>
createRoute({
    path: ERouterPath.TEST_PAGE,
    component: lazyRouteComponent(() => import('@pages/test_page/component')),
    getParentRoute: () => parentRoute,
})

export { createTestPageRoute }