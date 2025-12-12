import { z } from 'zod/v4'

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const PASSWORD_REGEX = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,1024}$/;
const NAME_REGEX = /^[a-zA-Zа-яА-ЯёЁ\-‐]+$/;

const errorLength = (field: string, min: number, max: number) =>
    `Допустимая длина ${field} от ${min} до ${max} символов`;

const ERROR_MESSAGES = {
    EMPTY_FIELD: 'Поле не заполнено',
    INCORRECT_CHARACTERS: 'Используются некорректные символы',
    WEAK_PASSWORD: 'Пароль слишком простой. Используйте строчные и заглавные буквы, цифры и символы',
    PASSWORD_MISMATCH: 'Пароли не совпадают',
    NAME_LENGTH: errorLength('имени', 2, 127),
    LASTNAME_LENGTH: errorLength('фамилии', 2, 127),
    EMAIL_LENGTH: errorLength('e-mail', 1, 255),
    PASSWORD_LENGTH: errorLength('пароля', 8, 1024),
}

const registrationSchema = z
    .object({
        firstName: z
            .string()
            .min(1, ERROR_MESSAGES.EMPTY_FIELD)
            .min(2, ERROR_MESSAGES.NAME_LENGTH)
            .max(127, ERROR_MESSAGES.NAME_LENGTH)
            .regex(NAME_REGEX, ERROR_MESSAGES.INCORRECT_CHARACTERS),
        lastName: z
            .string()
            .min(1, ERROR_MESSAGES.EMPTY_FIELD)
            .min(2, ERROR_MESSAGES.LASTNAME_LENGTH)
            .max(127, ERROR_MESSAGES.LASTNAME_LENGTH)
            .regex(NAME_REGEX, ERROR_MESSAGES.INCORRECT_CHARACTERS),
        middleName: z
            .string()
            .min(1, ERROR_MESSAGES.EMPTY_FIELD)
            .min(2, ERROR_MESSAGES.LASTNAME_LENGTH)
            .max(127, ERROR_MESSAGES.LASTNAME_LENGTH)
            .regex(NAME_REGEX, ERROR_MESSAGES.INCORRECT_CHARACTERS),
        email: z
            .string()
            .min(1, ERROR_MESSAGES.EMPTY_FIELD)
            .max(255, ERROR_MESSAGES.EMAIL_LENGTH)
            .regex(EMAIL_REGEX, ERROR_MESSAGES.INCORRECT_CHARACTERS),
        password: z
            .string()
            .min(1, ERROR_MESSAGES.EMPTY_FIELD)
            .min(8, ERROR_MESSAGES.PASSWORD_LENGTH)
            .max(1024, ERROR_MESSAGES.PASSWORD_LENGTH)
            .regex(PASSWORD_REGEX, ERROR_MESSAGES.WEAK_PASSWORD),
        confirmPassword: z
            .string()
            .min(1, ERROR_MESSAGES.EMPTY_FIELD),
    })
    .refine((data) => data.password === data.confirmPassword, {
        path: ['confirmPassword'],
        message: ERROR_MESSAGES.PASSWORD_MISMATCH,
    })

export { registrationSchema }
