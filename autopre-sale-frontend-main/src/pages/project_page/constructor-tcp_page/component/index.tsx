import {Button} from "@shared/components/form/button";
import style from '../style/constructor.module.css'
import {BlockList} from "@shared/components/constructor_tcp/block_list";
import {useConstructorPagePresenter} from "@pages/project_page/constructor-tcp_page/presenter";
import {ModalTkp} from "@shared/components/modal_tkp/modal_tkp.tsx";
import AccordionTKP from "@shared/components/modal_tkp/component/AccordionTKP.tsx";
import {BlockEditor} from "@pages/project_page/constructor-tcp_page/component/blockEditor.tsx";
import {SlideList} from "@pages/project_page/constructor-tcp_page/component/slideList.tsx";


const ConstructorPage = () => {

    const {
        blockListProps,
        slideListProps,
        blockEditorProps,
        modalTemplatesProps,
        activeSlide,
        showTemplateModal, setShowTemplateModal,
    } = useConstructorPagePresenter()

    return (
        <div className={style.main}>
            <div className={'flex justify-between px-5'}>
                <Button outline onClick={() => setShowTemplateModal(true)}>Библиотека блоков</Button>
                <Button>Сгенерировать ТКП</Button>
            </div>
            <div className={style.constructorContainer}>
                <div className={style.leftCol}>
                    <div>
                        <h2>
                        Структура ТКП
                        </h2>
                        <div className={style.scrollList}>
                            <BlockList {...blockListProps}/>
                        </div>
                    </div>
                    <div>
                        <h2>
                            Слайды
                        </h2>
                        <div className={style.scrollList}>
                            <SlideList {...slideListProps}/>
                        </div>
                    </div>
                </div>
                <div className={style.pageCol}>
                    {activeSlide ? (
                        <div className={style.page}>
                            {activeSlide?.title}
                        </div>
                    ):(
                        <div>
                            Слайд не выбран
                        </div>
                    )}
                </div>
                <div className={style.rightCol}>
                    <BlockEditor {...blockEditorProps}/>
                </div>
            </div>
            <ModalTkp
                isOpen={showTemplateModal}
                onClose={() => setShowTemplateModal(false)}
            >
                <AccordionTKP
                    {...modalTemplatesProps}
                />
            </ModalTkp>
        </div>
    )
}

export default ConstructorPage