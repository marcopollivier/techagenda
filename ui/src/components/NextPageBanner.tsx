
interface Props {
    onClick: () => void
}

export default function NextPageBanner({ onClick }: Props) {
    return (
        <div className="relative overflow-hidden bg-white my-24">
            <div className="grid place-content-center place-items-center">
                <div className="my-2 max-w-3xl text-center">
                    <h1 className="font-medium text-4xl tracking-tight text-gray-900">
                        Continue explorando os melhores eventos de Tecnologia do Brasil
                    </h1>
                </div>
                <div className="mt-6">
                    <a href="#"
                        onClick={onClick}
                        className="inline-block rounded-full border border-transparent bg-blue-500 px-8 py-3 text-center font-medium text-white hover:opacity-90"
                    >
                        Mostrar mais
                    </a>
                </div>
            </div>
        </div>
    )
}
