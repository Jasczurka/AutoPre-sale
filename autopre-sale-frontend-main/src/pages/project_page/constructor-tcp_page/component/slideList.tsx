import type {ISlideListProps} from "@shared/components/constructor_tcp/block_list";
import {cn} from "@shared/lib/cn";
import style from "@pages/project_page/constructor-tcp_page/style/constructor.module.css";

const SlideList = ({list, onSelectSlide, handleSlideContextMenu}: ISlideListProps) => {


    return (
        <div className={'flex flex-col gap-2 items-center pt-2 pb-6'}>
            {list.map((slide, index) => (
                <div
                    className={'flex'}
                    key={index}
                    onClick={() => onSelectSlide?.(slide.id)}
                    onContextMenu={(e)=>handleSlideContextMenu?.(e, slide.id, slide.order?.toString() ?? slide.id)}
                >
                    {slide.order}
                    <div className={cn(style.page, style.item, slide.isActive && style.active)}>

                    </div>
                </div>
            ))}
        </div>
    )
}

export {SlideList}