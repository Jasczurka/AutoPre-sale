import {Link} from "@tanstack/react-router";
import style from '../style/404.module.css'

const PageNotFound = () => {
    return (
        <div className={style.main}>
            <h1>Ошибка 404</h1>
            <p>Страница не найдена</p>
            <Link to="/">Вернуться на главную</Link>
        </div>
    )
}

export {PageNotFound}