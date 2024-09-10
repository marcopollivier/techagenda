import React, { Fragment, useState } from 'react'
import { Combobox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpIcon, XMarkIcon } from '@heroicons/react/20/solid'

type TagPickerProps = {
  tags: string[]
  selectedTags: string[]
  setSelected: (tags: string[]) => void
}

export const TagPicker = ({
  tags,
  selectedTags,
  setSelected,
}: TagPickerProps) => {
  const [query, setQuery] = useState('')
  const [dropdown, setDropdown] = useState(false)

  const filteredTags =
    query === ''
      ? tags
      : tags.filter((tag) => {
          return tag.toLowerCase().includes(query.toLowerCase())
        })

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
    setDropdown(true)
  }

  const addTag = (item: string[]) => {
    setSelected(item)
    setQuery('')
    setDropdown(false)
  }

  const removeTag = (item: string) => {
    const filtered = selectedTags.filter((e) => e !== item)

    setSelected(filtered)
    setQuery('')
  }

  return (
    <div className="autocomplete-wrapper">
      <Combobox value={selectedTags} onChange={addTag} multiple>
        <div className="relative mt-1">
          <div className="autocomplete w-full flex flex-col items-center mx-auto">
            <div className="w-full flex flex-col items-center relative">
              <div className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:text-sm sm:leading-6">
                <div className="flex flex-auto flex-wrap w-full items-center">
                  {selectedTags.map((tag, index) => (
                    <div
                      key={index}
                      className="flex justify-center items-center m-1 font-medium py-1 px-2 rounded-full text-white bg-blue-500"
                    >
                      <div className="text-xs font-normal leading-none max-w-full flex-initial">
                        {tag}
                      </div>

                      <div className="flex flex-auto flex-row-reverse">
                        <div onClick={() => removeTag(tag)} className="px-1">
                          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex-1">
                    <Combobox.Input
                      className="w-full bg-transparent border-transparent p-1 px-2 appearance-none outline-none text-sm leading-5 text-gray-900"
                      onChange={onInputChange}
                      value={query}
                    />
                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpIcon
                        className="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </Combobox.Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Transition
            as={Fragment}
            show={dropdown}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {filteredTags.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                  Não conheço essa tag
                </div>
              ) : (
                filteredTags.map((tag) => (
                  <Combobox.Option
                    key={tag}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-blue-500 text-white' : 'text-gray-900'
                      }`
                    }
                    value={tag}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? 'font-medium' : 'font-normal'
                          }`}
                        >
                          {tag}
                        </span>

                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? 'text-white' : 'text-blue-500'
                            }`}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
    </div>
  )
}
