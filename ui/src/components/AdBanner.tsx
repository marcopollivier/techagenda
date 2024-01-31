import { CursorArrowRaysIcon } from '@heroicons/react/20/solid'
import TechBro from '../../public/tech_bro.png'

export default function AdBanner() {
    return (
        <div className="relative bg-white">
            <div className="relative isolate overflow-hidden bg-blue-500 shadow-2xl rounded-3xl lg:flex h-1/6">
                <div className="ml-6 max-w-md text-center lg:flex-auto lg:py-32 lg:text-left">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Crie, promova e busque por eventos de Tecnologia facilmente.
                    </h2>
                    <div className="flex mt-10">
                        <a href="#" className="flex items-center justify-between rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-blue-500 shadow-sm hover:bg-gray-100 transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300">
                            <CursorArrowRaysIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            Juntar-se ao bonde
                        </a>
                    </div>
                </div>
                <div className="relative place-self-end">
                    <img
                        className="w-[57rem] object-right-bottom"
                        src={TechBro}
                        alt="App screenshot"
                        width={1794}
                        height={2304}
                    />
                </div>
            </div>
        </div>
    )
}
