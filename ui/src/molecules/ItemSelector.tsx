import { RadioGroup } from '@headlessui/react';

export interface SelectorOption {
    title: string
    subtitle: string
    value: string
}

interface SelectorProps {
    label: string
    options: SelectorOption[]
    selected: string
    setSelected: (option: string) => void
}

export default function ItemSelector({ label, options, selected, setSelected }: SelectorProps) {
    return (
        <div className="w-full">
            <div className="mx-auto w-full max-w-md">
                <RadioGroup value={selected} onChange={setSelected}>
                    <RadioGroup.Label className="sr-only">{label}</RadioGroup.Label>
                    <div className="space-y-2">
                        {options.map((option) => (
                            <RadioGroup.Option
                                key={option.title}
                                value={option.value}
                                className={({ active, checked }) =>
                                    `${active
                                        ? 'ring-2 ring-white/60 ring-offset-2 ring-offset-blue-500'
                                        : ''
                                    }
                  ${checked ? 'bg-blue-600/75 text-white' : 'bg-white'}
                    relative flex cursor-pointer rounded-lg px-5 py-4 shadow-md focus:outline-none`
                                }
                            >
                                {({ active, checked }) => (
                                    <>
                                        <div className="flex w-full items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="text-sm">
                                                    <RadioGroup.Label
                                                        as="p"
                                                        className={`font-medium  ${checked ? 'text-white' : 'text-gray-900'
                                                            }`}
                                                    >
                                                        {option.title}
                                                    </RadioGroup.Label>
                                                    {option.subtitle.length > 0 ?
                                                        (
                                                            <RadioGroup.Description
                                                                as="span"
                                                                className={`inline ${checked ? 'text-sky-100' : 'text-gray-500'
                                                                    }`}
                                                            >
                                                                <span>
                                                                    {option.subtitle}
                                                                </span>{' '}
                                                                <span aria-hidden="true">&middot;</span>{' '}
                                                            </RadioGroup.Description>
                                                        )
                                                        : null}
                                                </div>
                                            </div>
                                            {checked && (
                                                <div className="shrink-0 text-white">
                                                    <CheckIcon className="h-6 w-6" />
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </RadioGroup.Option>
                        ))}
                    </div>
                </RadioGroup>
            </div>
        </div>
    )
}

function CheckIcon(props: any) {
    return (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
            <circle cx={12} cy={12} r={12} fill="#fff" opacity="0.2" />
            <path
                d="M7 13l3 3 7-7"
                stroke="#fff"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}
