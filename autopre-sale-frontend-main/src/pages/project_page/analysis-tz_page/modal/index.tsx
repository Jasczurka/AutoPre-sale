import type {IModalShowParams} from "@widgets/modal/interface";
import {Button} from "@shared/components/form/button";

const BacklogDeleteRowModal = () : IModalShowParams => {

    return {
        title: 'Вы точно хотите удалить элемент бэклога?',
        content: <>
            <Button outline>
                Отмена
            </Button>
            <Button>
                Удалить
            </Button>
        </>
    }
}

export { BacklogDeleteRowModal }