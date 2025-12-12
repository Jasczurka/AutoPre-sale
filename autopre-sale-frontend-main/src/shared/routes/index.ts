enum ERouterPath{
    MAIN_PAGE = '/',
    ANALYSIS = "/analysis-tz",
    CONSTRUCTOR = "/constructor-tcp",
    PROJECT = "/project",
    AUTHORIZATION_PAGE = '/sign-in',
    PROJECTS_PAGE = '/projects',
    PROJECT_PAGE = `${PROJECT}/$projectId`,
    ANALYSIS_PAGE = `${PROJECT}/$projectId${ANALYSIS}`,
    CONSTRUCTOR_PAGE = `${PROJECT}/$projectId${CONSTRUCTOR}`,
    TEST_PAGE = '/test',
}

export default ERouterPath;