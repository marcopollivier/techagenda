import { useEffect } from 'react';
import TechAgendaLogoFooter from "../../public/logo.svg";
import { ChevronUpIcon } from '@heroicons/react/20/solid';

export default function Footer() {

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }, []);

    return (
        <div className="bg-white">
            <div className="mx-auto">
                <div className="relative h-32 flex justify-between">
                    <div className="flex flex-shrink-0 items-center">
                        <img
                            className="h-10 w-auto"
                            src={TechAgendaLogoFooter}
                            alt="TechAgenda"
                        />
                    </div>
                    <div className="relative flex items-center justify-between">
                        <button
                            onClick={() => {
                                window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                            }}
                            type="button"
                            className="inline-flex items-center rounded-full text-center px-6 py-2 text-sm font-medium shadow-sm bg-blue-500 text-white hover:bg-gray-100 hover:text-blue-500 shadow-lg ring-1 ring-black ring-opacity-5"
                        >
                            <ChevronUpIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            Voltar ao topo
                        </button>
                    </div>
                </div>
                {/* divider */}
                <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 border-t border-gray-200 pt-4 lg:mx-0 lg:max-w-none lg:grid-cols-3"></div>
                {/* copyright and links */}
                <div className="flex items-center justify-between">
                    <p className="flex">© 2024 Tech Agenda</p>
                    <div className="flex items-center justify-between text-slate-700 antialiased font-semibold">
                        <p className="hover:bg-blue-500 hover:text-white rounded-full px-3 py-1 text-sm">Github</p>
                        <div className="px-4">
                            <div className="rounded border-2 border-slate-700"></div>
                        </div>
                        <p className="hover:bg-blue-500 hover:text-white rounded-full px-3 py-1 text-sm">Termos</p>
                    </div>
                    <p className="flex self-en">Construído com tecnologia brasileira</p>
                </div>
            </div>
        </div>
    )
}
