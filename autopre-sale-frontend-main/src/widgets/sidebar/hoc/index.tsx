import {type ComponentType, useEffect} from "react";
import {useSidebarLayout} from "@widgets/sidebar/case/context";

const withTitle = (title: string) =>
    <P extends object>(Component: ComponentType<P>) => {
        const WrappedObject = (props: P) => {
            const {setTitle} = useSidebarLayout();

            useEffect(() => {
                setTitle(title);
            }, [setTitle]);

            return <Component {...props} />
        }

        WrappedObject.displayName = `withTitle(${Component.displayName || Component.name || "Component"})`;

        return WrappedObject;
    }

export default withTitle;