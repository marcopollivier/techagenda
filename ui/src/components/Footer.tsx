import TechAgendaLogoFooter from "../../public/logo.svg";

export default function Footer() {
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
                    <div className="grid w-40 content-center">
                        <p className="hover:bg-gray-100 hover:text-blue-500 bg-blue-500 text-white rounded-full px-3 py-1 text-sm font-medium text-lg text-center">Voltar ao topo</p>
                    </div>
                </div>
                <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 border-t border-gray-200 pt-4 lg:mx-0 lg:max-w-none lg:grid-cols-3"></div>
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
