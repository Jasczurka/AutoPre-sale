import {Button} from "@/shared/components/form/button";
import {ProjectItem} from "@/shared/components/projects/projectItem";
import React, {useCallback} from "react";
import {useProjectsPresenter} from "@pages/projects_page/presenter";
import type {ISelectOption} from "@shared/lib/form/component/select/interface";

const SORT_VALUES: ISelectOption[] = [
        { value: 'recent', label: 'Созданы недавно' },
        { value: 'newest', label: 'Сначала новые' },
        { value: 'oldest', label: 'Сначала старые' },
        { value: 'name', label: 'По названию' },
    ]

const ProjectsPage = () => {
    const {
        form,
        projects,
        handleOpenProject,
        handleShowContextMenu,
        handleCreateProject
    } = useProjectsPresenter()

    const keyDown = useCallback((e: React.KeyboardEvent) => {
        e.stopPropagation();
        if (e.key === "Enter") {
            e.preventDefault();
            form.handleSubmit();
        }
    }, [form])

    return (
        <div className="flex flex-col gap-10 p-10">
            <div className="flex flex-col xl:flex-row justify-between w-full content-center items-start xl:items-center gap-4 xl:gap-0">
                <form className="flex flex-col xl:flex-row gap-4 xl:gap-[50px] w-full xl:w-auto">
                    <form.AppField name={'search'}>
                        {(field) => (
                            <field.TextField
                                placeholder={"Поиск"}
                                isSearch
                                onKeyDown={keyDown}
                            />
                        )}
                    </form.AppField>
                    {/*
                        <Input
                            type="search"
                            className="w-full xl:w-[400px] h-11 !rounded-4xl"
                            placeholder="Поиск"
                            name="search"
                        />


                        <button type="submit" className="sr-only">Применить фильтры</button>
                    */}
                    <form.AppField name={'sortType'}>
                        {(field) => (
                            <field.SelectField
                                options={SORT_VALUES}
                            />
                        )}
                    </form.AppField>
                </form>

                <Button
                    onClick={handleCreateProject}
                    type="button"
                    className="w-full xl:w-[200px] flex justify-between content-center gap-5"
                >
                    <span>Добавить</span>
                </Button>
            </div>

            {/* Список проектов */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {projects.map((project) => (
                    <ProjectItem
                        key={project.id}
                        project={project}
                        onOpen={() => handleOpenProject(project.id)}
                        onContextMenu={(e: React.MouseEvent) => handleShowContextMenu(e, project.id)}
                    />
                ))}
            </div>
        </div>
    )
}
export default ProjectsPage