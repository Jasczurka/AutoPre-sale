import {type AnyRoute, createRoute, lazyRouteComponent, redirect} from "@tanstack/react-router";
import ERouterPath from "@shared/routes";

const createAuthorizationPageRoute = (parentRoute: AnyRoute) =>
    createRoute({
        path: ERouterPath.AUTHORIZATION_PAGE,
        component: lazyRouteComponent(() => import('@pages/sign-in/component')),
        getParentRoute: () => parentRoute,
        beforeLoad: ({ context }) => {
            if (context.auth.isAuthenticated) {
                throw redirect({
                    to: ERouterPath.PROJECTS_PAGE as string
                })
            }
        },
    })

export { createAuthorizationPageRoute }