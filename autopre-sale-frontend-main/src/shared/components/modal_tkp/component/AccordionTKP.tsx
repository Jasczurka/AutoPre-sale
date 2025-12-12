import React, { useState } from 'react';
import '../style/AccordionTKP.css';
import type {ITemplateDto} from "@entities/block_template/interface/index.dto.ts";

interface IAccordionTKP {
  groupedTemplates?: Record<string, ITemplateDto[]>,
  addBlock?: (template: ITemplateDto) => void,
  isLoading?:boolean
}

const AccordionTKP: React.FC<IAccordionTKP> = ({
    groupedTemplates = {},
    addBlock,
    isLoading
}) => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const isItemOpen = (id: string) => openItems.has(id);

  if (isLoading) {
    return (
        <div className="accordion-tkp">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Загрузка шаблонов...</p>
          </div>
        </div>
    );
  }

  const categories = Object.keys(groupedTemplates || {});

  if (categories.length === 0) {
    return (
        <div className="accordion-tkp">
          <div className="empty-state">
            <p>Нет доступных шаблонов</p>
            <p className="empty-subtext">Загрузите шаблоны через административную панель</p>
          </div>
        </div>
    );
  }

  return (
    <div className="accordion-tkp">
      <div className="accordion-items">
        {categories.map((category) => (
          <div key={category} className={`accordion-item ${isItemOpen(category) ? 'active' : ''}`}>
            <div 
              className="accordion-item-header"
              onClick={() => toggleItem(category)}
            >
              <h3 className="accordion-item-title">{category}</h3>
              <span className="accordion-icon">
                {!isItemOpen(category) ? '▼' : '▲'}
              </span>
            </div>
            
            <div className="accordion-item-content">
              {groupedTemplates[category] && groupedTemplates[category].length > 0 ? (
                  <div className="content-grid">
                    {groupedTemplates[category].map((template, index) =>  (
                        <div
                            key={index}
                            className={'w-full h-full flex flex-col gap-0 items-center hover:bg-gray-100 p-2 rounded-md'}
                            onClick={() => addBlock?.(template)}
                        >
                            <span  className="content-text" >
                                {template.name}
                            </span>
                            <span className={'text-xs text-gray-600'}>
                                {template.code}
                            </span>
                        </div>

                    ))}
                  </div>
              ) : (
                  <div className="no-templates">Нет шаблонов в этой категории</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export type {IAccordionTKP};
export default AccordionTKP;