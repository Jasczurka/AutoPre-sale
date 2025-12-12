import React, {type ComponentProps} from "react";
import type {IProjectDto} from "@entities/project/interface/dto";

interface IProjectItemProps extends ComponentProps<'div'> {
    project: IProjectDto;
    onOpen: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
}

export type { IProjectItemProps };