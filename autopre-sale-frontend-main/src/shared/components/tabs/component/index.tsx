import {type FC, useState} from "react";
import type {ITabsProps} from "@shared/components/tabs/interface";
import Tab from "@shared/components/tabs/tab";

const Tabs: FC<ITabsProps> = ({ tabs, className}) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const handleChangeTab = (index: number) => {
        setActiveIndex(index);
    }

    return (
        <div className={className}>
            <nav>
                <ul className="flex flex-wrap justify-between px-[20px] text-[20px] font-semibold text-center" role="tablist">
                    {tabs.map((tab, index)=>(
                        <li key={index} role="presentation">
                            <Tab
                                label={tab.label}
                                onClick={()=>handleChangeTab(index)}
                                active={ activeIndex === index }
                                aria={tab.aria}/>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className={'h-auto'} role='tabpanel'>
                {tabs.map((tab, index)=>(
                    <div
                        key={index}
                        className={`${activeIndex === index ? '' : 'hidden'}`}
                        id={tab.aria}
                        role='tabpanel'
                        aria-labelledby={`${tab.aria}-tab`}
                    >
                        {tab.content}
                    </div>
                ))}
            </div>
        </div>
    )
}
export {Tabs}