import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Event } from '../props/lending.generated';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Moment from 'moment';

interface EventModalPorps {
  event: Event
  openDetails: boolean
  onClose: () => void
}

export default function EventModal({ event, openDetails, onClose }: EventModalPorps) {
  return (
    <Transition.Root show={openDetails} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-2/4">
                <div className="absolute flex right-0 items-center overflow-hidden pb-8 pt-14 sm:px-6 sm:pt-8 md:p-6">
                  <button
                    type="button"
                    className="static focus:outline-none"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-10 w-10 px-2 py-2 rounded-full bg-white/10 text-white hover:text-gray-300" aria-hidden="true" />
                  </button>
                </div>
                <div className="static h-80 w-full overflow-hidden bg-gray-200 object-cover">
                  <img
                    src={event.banner}
                    className="object-cover object-center"
                  />
                </div>
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 h-60">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                        {event.title}
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          {Moment(event.begin).format('DD/MM')} - {Moment(event.end).format('DD/MM')}
                        </p>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          {event.description}
                        </p>
                      </div>
                      {event.venues.map((venue) => (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            {venue.address}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
