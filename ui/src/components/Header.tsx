import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import TechAgendaLogo from '../../public/logo.svg';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/20/solid';
import LoginButton from '../organisms/LoginButton';
import { User } from "../props/generated";
import classNames from '../helper/classNames';

const navigation = [
    { name: 'Todos os eventos', href: '#', slug: "main" },
    { name: 'Design', href: '#', slug: "design" },
    { name: 'Product', href: '#', slug: "product" },
    { name: 'DevOps', href: '#', slug: "devops" },
    { name: 'Software', href: '#', slug: "software" },
    { name: 'Management', href: '#', slug: "management" },
]

interface HeaderProps {
    user: User
    currentPage: string
}

export default function Header({ user, currentPage }: HeaderProps) {
    return (
        <Disclosure as="nav" className="pt-8 pb-6">
            {({ open }) => (
                <>
                    <div className="">
                        <div className="relative flex h-10 items-center justify-between">
                            {/* Logo */}
                            <div className="flex flex-shrink-0 items-center">
                                <img className="h-10 w-auto" src={TechAgendaLogo} alt="Tech Agenda" />
                            </div>
                            {/* User's area */}
                            <LoginButton user={user} />
                        </div>
                        <div className="relative h-20 pt-24 flex justify-between">
                            {/* Main menu options */}
                            <div className="relative flex items-center justify-between">
                                <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                                    {/* Mobile menu button*/}
                                    <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                                        <span className="absolute -inset-0.5" />
                                        <span className="sr-only">Open main menu</span>
                                        {open ? (
                                            <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                                        ) : (
                                            <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                                        )}
                                    </Disclosure.Button>
                                </div>
                                <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                                    <div className="hidden sm:block">
                                        <div className="flex space-x-4 rounded-full bg-gray-100 px-2 py-1">
                                            {navigation.map((item) => (
                                                <a
                                                    key={item.name}
                                                    href={item.href}
                                                    className={classNames(
                                                        item.slug === currentPage ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:bg-gray-200 hover:text-black',
                                                        'rounded-full px-3 py-1 text-sm font-medium'
                                                    )}
                                                    aria-current={item.slug === currentPage ? 'page' : undefined}
                                                >
                                                    {item.name}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                            </div>
                            {/* Filters menu item */}
                            <div className="relative flex items-center justify-between">
                                <button
                                    type="button"
                                    className="inline-flex items-center rounded-full bg-gray-100 px-3 py-2 text-sm font-medium text-black shadow-sm hover:bg-blue-500 hover:text-white shadow-lg ring-1 ring-black ring-opacity-5"
                                >
                                    <AdjustmentsHorizontalIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                                    Filtros
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )
            }
        </Disclosure >
    )
}
