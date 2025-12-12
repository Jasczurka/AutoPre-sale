import type {ITemplateDto} from "@entities/block_template/interface/index.dto.ts";

export const STUB_TEMPLATES: ITemplateDto[] = [
    {
        id: "1",
        code: "project_overview_v1",
        name: "Описание проекта",
        description: "Блок описания проекта с заголовком и описанием",
        version: 1,
        fields: {
            title: { type: "text", placeholderName: "TitlePlaceholder", required: true, label: "Заголовок" },
            description: { type: "textarea", placeholderName: "Body" }
        },
        fileUrl: "/api/templates/files/project_overview_v1.pptx",
        createdAt: "2024-01-01T10:00:00Z"
    },
    {
        id: "2",
        code: "project_goals_v1",
        name: "Цели проекта",
        description: "Блок с целями проекта (до 5 целей)",
        version: 1,
        fields: {
            title: { type: "text", placeholderName: "Title", required: true, label: "Заголовок" },
            goal1: { type: "text", placeholderName: "Goal1" },
            goal2: { type: "text", placeholderName: "Goal2" },
            goal3: { type: "text", placeholderName: "Goal3" },
            goal4: { type: "text", placeholderName: "Goal4" },
            goal5: { type: "text", placeholderName: "Goal5" }
        },
        fileUrl: "/api/templates/files/project_goals_v1.pptx",
        createdAt: "2024-01-01T11:00:00Z"
    },
    {
        id: "3",
        code: "technical_solution_v1",
        name: "Техническое решение",
        description: "Блок описания технического решения",
        version: 1,
        fields: {
            title: { type: "text", placeholderName: "Title", required: true, label: "Заголовок" },
            architecture: { type: "textarea", placeholderName: "Architecture" },
            technologies: { type: "list", placeholderName: "Technologies" },
            requirements: { type: "textarea", placeholderName: "Requirements" }
        },
        fileUrl: "/api/templates/files/technical_solution_v1.pptx",
        previewUrl: "/api/templates/previews/technical_solution_v1.png",
        createdAt: "2024-01-01T12:00:00Z"
    },
    {
        id: "4",
        code: "timeline_v1",
        name: "План работ",
        description: "Блок с планом работ и сроками",
        version: 1,
        fields: {
            title: { type: "text", placeholderName: "Title", required: true, label: "Заголовок" },
            phase1: { type: "text", placeholderName: "Phase1" },
            phase2: { type: "text", placeholderName: "Phase2" },
            phase3: { type: "text", placeholderName: "Phase3" },
            deadline: { type: "text", placeholderName: "Deadline" }
        },
        fileUrl: "/api/templates/files/timeline_v1.pptx",
        previewUrl: "/api/templates/previews/timeline_v1.png",
        createdAt: "2024-01-01T13:00:00Z"
    },
    {
        id: "5",
        code: "budget_v1",
        name: "Бюджет",
        description: "Блок с бюджетом проекта",
        version: 1,
        fields: {
            title: { type: "text", placeholderName: "Title", required: true, label: "Заголовок", defaultValue: "Бюджет" },
            total: { type: "number", placeholderName: "Total" },
            breakdown: { type: "textarea", placeholderName: "Breakdown" }
        },
        fileUrl: "/api/templates/files/budget_v1.pptx",
        previewUrl: "/api/templates/previews/budget_v1.png",
        createdAt: "2024-01-01T14:00:00Z"
    }
];