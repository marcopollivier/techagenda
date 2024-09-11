import { useEffect } from 'react'
import TechAgendaLogoFooter from '../../public/logo.svg'
import { ChevronUpIcon } from '@heroicons/react/20/solid'
import Flag from 'react-world-flags'

export const Footer = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [])

  const handleScroll = () =>
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })

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
              onClick={handleScroll}
              type="button"
              className="inline-flex items-center rounded-full border border-transparent bg-blue-500 px-8 py-3 text-center font-medium text-white hover:opacity-90"
            >
              <ChevronUpIcon
                className="-ml-0.5 mr-1.5 h-5 w-5"
                aria-hidden="true"
              />
              Voltar ao topo
            </button>
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 border-t border-gray-200 pt-4 lg:mx-0 lg:max-w-none lg:grid-cols-3"></div>

        <div className="flex items-center justify-between">
          <p className="flex">© 2024 Tech Agenda</p>

          <div className="flex items-center justify-between text-slate-700 antialiased font-semibold">
            <p className="hover:bg-blue-500 hover:text-white rounded-full px-3 py-1 text-sm">
              Github
            </p>

            <div className="px-4">
              <div className="rounded border-2 border-slate-700"></div>
            </div>

            <p className="hover:bg-blue-500 hover:text-white rounded-full px-3 py-1 text-sm">
              Termos
            </p>
          </div>

          <div className="flex self-en justify-between">
            <p>Construído com tecnologia brasileira</p>
            <Flag code="BRA" className="h-6 pl-2" />
          </div>
        </div>
      </div>
    </div>
  )
}
