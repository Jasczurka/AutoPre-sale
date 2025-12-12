import {Button} from "@shared/components/form/button";
import {Input} from "@shared/components/form/input/component";
import {useTestPagePresenter} from "@pages/test_page/case/presenter";
import {BacklogTable, StaticTable} from "@shared/components/table";
import type {FormEvent} from "react";
import {useState} from "react";
import { ModalTkp } from "@/shared/components/modal_tkp/modal_tkp";
import AccordionTKP from "@/shared/components/modal_tkp/component/AccordionTKP";


const TestPage = () => {
    const {
        form,
        showModalHandle,
        stateTableData,
        showContextMenuHandel
    } = useTestPagePresenter()

    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        await form.handleSubmit()
    }

    return (
        <div className={'flex flex-col gap-2'}>
            <div className={'flex gap-2'}>
                <Button onClick={showModalHandle}>
                    Кнопка
                </Button>
                <Button onClick={showContextMenuHandel} outline>
                    Кнопка
                </Button>
                <Button disabled>
                    Кнопка
                </Button>
                <Button outline disabled>
                    Кнопка
                </Button>
            </div>

            <div className={'flex gap-2'}>
                <form className={'flex flex-col gap-2'} onSubmit={handleSubmit}>
                    <form.AppField name={'input'}>
                        {(field) => (
                            <field.TextField
                                label={'Заголовок'}
                                className={'w-[300px]'}
                                placeholder={'Введите значение'}
                            />
                        )}
                    </form.AppField>
                    <form.AppForm>
                        <form.SubscribeButton>
                            Кнопка
                        </form.SubscribeButton>
                    </form.AppForm>
                </form>
                <Input placeholder={'Введите значение'}/>

                <Input placeholder={'Введите значение'} disabled/>
            </div>
            <div>
                <Button onClick={() => setIsModalOpen(true)}>
                    Показать шаблоны
                </Button>

                <ModalTkp
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                >
                    <AccordionTKP />
                </ModalTkp>
            </div>
            <StaticTable {...stateTableData}/>
            <BacklogTable/>
        </div>

    )
}
export default TestPage;