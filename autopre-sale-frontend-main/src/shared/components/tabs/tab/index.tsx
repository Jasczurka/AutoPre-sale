import type {FC} from "react";
import type {ITabProps} from "@shared/components/tabs/interface";
import style from '../style/tab.module.css'


const Tab: FC<ITabProps> =
({
     label,
     onClick,
     active ,
     aria
}) => {
    return (
        <button
            className={style.tab}
            id={`${aria}-tab`} role='tab'
            type={'button'}
            aria-controls={aria}
            onClick={onClick}
            aria-selected={active}
        >
            {label}
        </button>
    );
};

export default Tab;