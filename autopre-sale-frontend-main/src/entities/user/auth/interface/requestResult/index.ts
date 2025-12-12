import type {UseMutationResult} from "@tanstack/react-query";
import type {IRegisterDto} from "../dto";
import type {IRegisterPort} from "../port";

type IUseRegisterRequestResult = UseMutationResult<
    IRegisterDto,           // Успешный ответ
    Error,                  // Ошибка
    IRegisterPort,          // Входные данные
    unknown                 // Контекст (не используем)
>

export type { IUseRegisterRequestResult }