import TechAgendaLogo from "../../public/logo.svg";
import Footer from "../components/Footer";

export default function Termos() {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <nav className="bg-white shadow-sm px-6 py-4">
                <div className="mx-auto max-w-4xl flex items-center gap-4">
                    <a href="/"><img className="h-8 w-auto" src={TechAgendaLogo} alt="Tech Agenda" /></a>
                    <span className="text-gray-400">|</span>
                    <span className="text-sm font-semibold text-gray-700">Termos de Uso</span>
                </div>
            </nav>

            {/* Content */}
            <main className="flex-1 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
                <article className="prose prose-gray max-w-none">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Termos de Uso</h1>
                    <p className="text-sm text-gray-500 mb-8">Ultima atualizacao: Marco de 2026</p>

                    <p className="text-gray-700 leading-relaxed">
                        Bem-vindo ao TechAgenda.
                    </p>
                    <p className="text-gray-700 leading-relaxed mb-8">
                        Estes Termos de Uso regulam o acesso e a utilizacao deste website. Ao utilizar a plataforma, voce concorda com os termos e condicoes descritos abaixo.
                    </p>

                    <Section title="1. Sobre a Plataforma">
                        <p>
                            O TechAgenda e um <strong>hub colaborativo de eventos de tecnologia</strong>, cujo objetivo e centralizar e divulgar informacoes sobre eventos, meetups, conferencias e encontros da comunidade.
                        </p>
                        <p>
                            A plataforma funciona como um <strong>repositorio colaborativo</strong>, onde eventos podem ser listados e organizados em um calendario publico para facilitar a descoberta e o acompanhamento pela comunidade.
                        </p>
                        <p>
                            O TechAgenda <strong>nao e uma plataforma de gerenciamento de eventos</strong>.
                        </p>
                    </Section>

                    <Section title="2. Natureza do Servico">
                        <p>O TechAgenda oferece exclusivamente:</p>
                        <ul className="list-disc pl-6 space-y-1 text-gray-700">
                            <li>Divulgacao de eventos</li>
                            <li>Organizacao de eventos em um calendario</li>
                            <li>Centralizacao de informacoes publicas sobre eventos</li>
                        </ul>
                        <p className="mt-4">A plataforma <strong>nao oferece</strong>:</p>
                        <ul className="list-disc pl-6 space-y-1 text-gray-700">
                            <li>Gestao de inscricoes</li>
                            <li>Controle de lista de participantes</li>
                            <li>Venda de ingressos</li>
                            <li>Processamento de pagamentos</li>
                            <li>Gestao logistica de eventos</li>
                        </ul>
                        <p className="mt-4">
                            Todas as atividades relacionadas a organizacao de eventos sao de <strong>responsabilidade exclusiva dos organizadores do evento</strong>.
                        </p>
                    </Section>

                    <Section title="3. Responsabilidade pelos Eventos">
                        <p>Os eventos listados no TechAgenda sao organizados por <strong>terceiros independentes</strong>.</p>
                        <p className="mt-4">Dessa forma:</p>
                        <ul className="list-disc pl-6 space-y-1 text-gray-700">
                            <li>O TechAgenda <strong>nao organiza eventos</strong></li>
                            <li>O TechAgenda <strong>nao garante a realizacao dos eventos</strong></li>
                            <li>O TechAgenda <strong>nao e responsavel por cancelamentos, alteracoes ou problemas relacionados aos eventos</strong></li>
                        </ul>
                        <p className="mt-4">Qualquer informacao relacionada a:</p>
                        <ul className="list-disc pl-6 space-y-1 text-gray-700">
                            <li>inscricao</li>
                            <li>pagamento</li>
                            <li>lista de participantes</li>
                            <li>localizacao</li>
                            <li>organizacao</li>
                        </ul>
                        <p className="mt-4">
                            deve ser tratada diretamente com os <strong>organizadores do evento</strong>.
                        </p>
                    </Section>

                    <Section title="4. Conteudo e Informacoes">
                        <p>As informacoes apresentadas na plataforma sao fornecidas pela comunidade ou por fontes publicas.</p>
                        <p className="mt-2">
                            Embora busquemos manter as informacoes atualizadas, <strong>nao garantimos a precisao ou atualizacao constante dos dados publicados</strong>.
                        </p>
                    </Section>

                    <Section title="5. Uso da Plataforma">
                        <p>Ao utilizar o TechAgenda, o usuario concorda em:</p>
                        <ul className="list-disc pl-6 space-y-1 text-gray-700">
                            <li>Utilizar a plataforma de forma responsavel</li>
                            <li>Nao publicar informacoes falsas ou enganosas</li>
                            <li>Nao utilizar a plataforma para atividades ilegais</li>
                        </ul>
                    </Section>

                    <Section title="6. Modificacoes nos Termos">
                        <p>Estes Termos de Uso podem ser modificados a qualquer momento para refletir melhorias ou mudancas no servico.</p>
                        <p className="mt-2">Recomendamos que os usuarios revisem esta pagina periodicamente.</p>
                    </Section>

                    <Section title="7. Contato">
                        <p>
                            Em caso de duvidas sobre estes Termos de Uso, entre em contato atraves do{" "}
                            <a href="https://github.com/marcopollivier/techagenda" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                repositorio oficial do projeto
                            </a>.
                        </p>
                    </Section>
                </article>
            </main>

            {/* Footer */}
            <div className="mt-auto px-6">
                <Footer />
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <>
            <hr className="border-gray-200 my-8" />
            <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
                {children}
            </div>
        </>
    );
}
