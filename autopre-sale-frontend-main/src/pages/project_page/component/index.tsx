import {Outlet, useParams} from "@tanstack/react-router";
import ERouterPath from "@shared/routes";
import {ProjectProvider} from "@pages/project_page/provider";

const ProjectPage = () => {
    const {projectId} = useParams({from: `/app${ERouterPath.PROJECT_PAGE}`})

    return (
        <ProjectProvider projectId={projectId}>
            <Outlet/>
        </ProjectProvider>
    )
}
export default ProjectPage