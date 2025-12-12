import AuthForm from "../authorization_form/component";
import {RegistrationForm} from "../registration_form/component";
import {Logo} from "@shared/components/images/Logo.tsx";
import type {ITabsProps} from "@shared/components/tabs/interface";
import {useMemo} from "react";
import {Tabs} from "@shared/components/tabs/component";

const AuthorizationPage = () => {
    const tabsData: ITabsProps = useMemo(() => ({
        tabs: [
            {
                label: 'Вход',
                content: <AuthForm/>,
                aria: 'auth'
            },{
                label: 'Регистрация',
                content: <RegistrationForm/>,
                aria: 'registration',
            }
        ]
    }), []);

    return (
        <div className={'w-full h-full flex justify-center items-center p-5 overflow-y-auto max-lg:items-start'}>
            <div className={'w-[750px] h-fit bg-white text-black rounded-[15px] px-[100px] py-[50px] flex flex-col gap-[60px] items-center'}>
                <Logo/>
                <Tabs {...tabsData} className={'w-full flex flex-col gap-[40px]'}/>
            </div>
        </div>
    )
}

export default AuthorizationPage;