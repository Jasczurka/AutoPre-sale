import { useGetMeRequest } from '../request'
import {ELocalStorageKeys} from "@shared/enum/storage";

const useGetMePresenter = () => {
    const token = localStorage.getItem(ELocalStorageKeys.AUTH_TOKEN)

    const query = useGetMeRequest({
        enabled: !!token,
    })

    const data = query.data ?? null

    return {
        ...query,
        data,
    }
}

export { useGetMePresenter }
