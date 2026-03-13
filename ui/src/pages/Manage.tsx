import { useState, Fragment } from "react";
import { Dialog, Transition, Combobox } from "@headlessui/react";
import { PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon, MapPinIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { ChevronUpDownIcon, CheckIcon } from "@heroicons/react/20/solid";
import { Props, Event as EventType, Venue as VenueType } from "../props/generated";
import axios from "axios";
import Moment from "moment";
import TechAgendaLogo from "../../public/logo.svg";
import TagPicker from "../molecules/TagPicker";
import VenueMapPicker from "../components/VenueMapPicker";
import MarkdownEditor from "../components/MarkdownEditor";
import { debugLog } from "../lib/debug";

interface EventFormData {
    title: string; banner: string; description: string; href: string;
    type_of: string; begin: string; end: string;
    tags: string[]; venue_ids: number[];
    cfp_href: string; cfp_begin: string; cfp_end: string; has_cfp: boolean;
}

interface VenueFormData {
    alias: string; address: string; city: string; lat: string; long: string;
}

export default function Manage({ Events, User, Tags, TagsList, Venues, Environment: env }: Props) {
    debugLog(env, 'Manage page | User:', User, '| Role:', User?.Role ?? 'unknown');

    const [events, setEvents] = useState<EventType[]>(Events ?? []);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<EventType | null>(null);
    const [deletingEventId, setDeletingEventId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [venues, setVenues] = useState<VenueType[]>(Venues ?? []);
    const tagNames = (TagsList ?? []).map((t) => t.tag);

    const emptyForm: EventFormData = {
        title: "", banner: "", description: "", href: "",
        type_of: "in_person,online", begin: "", end: "",
        tags: [], venue_ids: [],
        cfp_href: "", cfp_begin: "", cfp_end: "", has_cfp: false,
    };
    const [form, setForm] = useState<EventFormData>(emptyForm);

    const emptyVenueForm: VenueFormData = { alias: "", address: "", city: "", lat: "", long: "" };
    const [inlineVenueOpen, setInlineVenueOpen] = useState(false);
    const [inlineVenueForm, setInlineVenueForm] = useState<VenueFormData>(emptyVenueForm);

    // --- Handlers ---

    const openCreate = () => {
        setEditingEvent(null);
        setForm(emptyForm);
        setError(null);
        setModalOpen(true);
    };

    const openEdit = (event: EventType) => {
        setEditingEvent(event);
        const hasCfp = !!event.cfp?.href;
        setForm({
            title: event.title,
            banner: event.banner,
            description: event.description,
            href: event.href,
            type_of: event.type_of?.join(",") ?? "in_person,online",
            begin: formatDateForInput(event.begin),
            end: formatDateForInput(event.end),
            tags: event.tags?.map((t) => t.tag) ?? [],
            venue_ids: event.venues?.map((v) => v.ID) ?? [],
            cfp_href: event.cfp?.href ?? "",
            cfp_begin: formatDateForInput(event.cfp?.begin),
            cfp_end: formatDateForInput(event.cfp?.end),
            has_cfp: hasCfp,
        });
        setError(null);
        setModalOpen(true);
    };

    const openDelete = (id: number) => {
        setDeletingEventId(id);
        setDeleteConfirmOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const payload = {
                title: form.title,
                banner: form.banner,
                description: form.description,
                href: form.href,
                type_of: form.type_of.split(",").map((t) => t.trim()).filter(Boolean),
                begin: form.begin ? new Date(form.begin).toISOString() : null,
                end: form.end ? new Date(form.end).toISOString() : null,
                tags: form.tags,
                venue_ids: form.venue_ids,
                cfp_href: form.has_cfp ? form.cfp_href : "",
                cfp_begin: form.has_cfp && form.cfp_begin ? new Date(form.cfp_begin).toISOString() : "",
                cfp_end: form.has_cfp && form.cfp_end ? new Date(form.cfp_end).toISOString() : "",
            };

            if (editingEvent) {
                const resp = await axios.put(`/manage/api/events/${editingEvent.ID}`, payload);
                setEvents(events.map((e) => (e.ID === editingEvent.ID ? resp.data : e)));
            } else {
                const resp = await axios.post("/manage/api/events", payload);
                setEvents([resp.data, ...events]);
            }
            setModalOpen(false);
        } catch (e: any) {
            setError(e?.response?.data?.error ?? "An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (deletingEventId === null) return;
        try {
            await axios.delete(`/manage/api/events/${deletingEventId}`);
            setEvents(events.filter((e) => e.ID !== deletingEventId));
            setDeleteConfirmOpen(false);
            setDeletingEventId(null);
        } catch (e: any) {
            setError(e?.response?.data?.error ?? "Failed to delete event");
        }
    };

    const handleInlineVenueCreate = async () => {
        try {
            const resp = await axios.post("/manage/api/venues", inlineVenueForm);
            const newVenue: VenueType = resp.data;
            setVenues([...venues, newVenue]);
            setForm({ ...form, venue_ids: [...form.venue_ids, newVenue.ID] });
            setInlineVenueOpen(false);
            setInlineVenueForm(emptyVenueForm);
        } catch (e: any) {
            setError(e?.response?.data?.error ?? "Failed to create venue");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top bar */}
            <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <a href="/"><img className="h-8 w-auto" src={TechAgendaLogo} alt="Tech Agenda" /></a>
                    <span className="text-gray-400">|</span>
                    <span className="text-sm font-semibold text-gray-700">Event Manager</span>
                </div>
                <div className="flex items-center gap-3">
                    {User && (
                        <>
                            <img className="h-8 w-8 rounded-full" src={User.Avatar} alt={User.Name} />
                            <span className="text-sm text-gray-700">{User.Name}</span>
                        </>
                    )}
                    <a href="/" className="text-sm text-blue-500 hover:underline ml-4">← Voltar ao site</a>
                </div>
            </nav>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                {/* Error banner */}
                {error && (
                    <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex justify-between items-center">
                        {error}
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><XMarkIcon className="h-4 w-4" /></button>
                    </div>
                )}

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Meus Eventos</h1>
                        <p className="text-sm text-gray-500 mt-1">{events.length} {events.length === 1 ? "evento" : "eventos"}</p>
                    </div>
                    <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition">
                        <PlusIcon className="h-4 w-4" /> Novo Evento
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evento</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datas</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Locais</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inscritos</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CFP</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {events.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">Nenhum evento ainda. Crie seu primeiro evento!</td></tr>
                            ) : events.map((event) => (
                                <Fragment key={event.ID}>
                                <tr className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {event.banner && (
                                                <img src={event.banner} alt={event.title} className="h-10 w-16 rounded-md object-cover bg-gray-100"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                            )}
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                                                {event.tags?.length > 0 && (
                                                    <div className="flex gap-1 mt-0.5">
                                                        {event.tags.map((t) => (
                                                            <span key={t.ID} className="text-xs text-gray-400">#{t.tag}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {event.type_of?.map((t) => (
                                                <span key={t} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{t}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <div>{Moment(event.begin).format("DD/MM/YYYY")}</div>
                                        <div className="text-gray-400">→ {Moment(event.end).format("DD/MM/YYYY")}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {event.venues?.length > 0 ? (
                                            <div className="flex items-center gap-1">
                                                <MapPinIcon className="h-3.5 w-3.5 text-gray-400" />
                                                <span>{event.venues.length}</span>
                                            </div>
                                        ) : <span className="text-gray-300">-</span>}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {event.attendees?.length ?? 0}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {event.cfp?.href ? (
                                            <span className="inline-flex items-center gap-1 text-green-600">
                                                <DocumentTextIcon className="h-3.5 w-3.5" /> Active
                                            </span>
                                        ) : <span className="text-gray-300">-</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEdit(event)} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition">
                                                <PencilSquareIcon className="h-3.5 w-3.5" /> Editar
                                            </button>
                                            <button onClick={() => openDelete(event.ID)} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition">
                                                <TrashIcon className="h-3.5 w-3.5" /> Excluir
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ========== EVENT CREATE / EDIT MODAL ========== */}
            <Transition.Root show={modalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={() => setModalOpen(false)}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                    </Transition.Child>
                    <div className="fixed inset-0 z-10 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:scale-95">
                                <Dialog.Panel className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col">
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                        <Dialog.Title className="text-base font-semibold text-gray-900">
                                            {editingEvent ? "Editar Evento" : "Criar Novo Evento"}
                                        </Dialog.Title>
                                        <button onClick={() => setModalOpen(false)} className="rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                                            <XMarkIcon className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                                        {error && (
                                            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
                                        )}

                                        <FormField label="Titulo *">
                                            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="Titulo do evento" />
                                        </FormField>

                                        <FormField label="Banner URL">
                                            <input type="url" value={form.banner} onChange={(e) => setForm({ ...form, banner: e.target.value })} className="input-field" placeholder="https://..." />
                                        </FormField>

                                        <FormField label="URL do Evento">
                                            <input type="url" value={form.href} onChange={(e) => setForm({ ...form, href: e.target.value })} className="input-field" placeholder="https://..." />
                                        </FormField>

                                        <FormField label="Descricao *">
                                            <MarkdownEditor value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Descricao do evento (suporta Markdown)" rows={6} />
                                        </FormField>

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField label="Data de Inicio *">
                                                <input type="datetime-local" value={form.begin} onChange={(e) => setForm({ ...form, begin: e.target.value })} className="input-field" />
                                            </FormField>
                                            <FormField label="Data de Fim *">
                                                <input type="datetime-local" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className="input-field" />
                                            </FormField>
                                        </div>

                                        <FormField label="Tipo">
                                            <div className="flex gap-3">
                                                {["in_person", "online"].map((t) => {
                                                    const selected = form.type_of.split(",").map(s => s.trim()).includes(t);
                                                    return (
                                                        <button key={t} type="button" onClick={() => {
                                                            const current = form.type_of.split(",").map(s => s.trim()).filter(Boolean);
                                                            const next = selected ? current.filter((x) => x !== t) : [...current, t];
                                                            setForm({ ...form, type_of: next.join(",") });
                                                        }} className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${selected ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                                                            {t === "in_person" ? "Presencial" : "Online"}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </FormField>

                                        <FormField label="Tags">
                                            <TagPicker tags={tagNames} selectedTags={form.tags} setSelected={(tags) => setForm({ ...form, tags })} />
                                        </FormField>

                                        <FormField label="Locais">
                                            <VenuePicker
                                                venues={venues}
                                                selectedIds={form.venue_ids}
                                                onChange={(ids) => setForm({ ...form, venue_ids: ids })}
                                                inlineVenueOpen={inlineVenueOpen}
                                                setInlineVenueOpen={setInlineVenueOpen}
                                                inlineVenueForm={inlineVenueForm}
                                                setInlineVenueForm={setInlineVenueForm}
                                                onInlineCreate={handleInlineVenueCreate}
                                                emptyVenueForm={emptyVenueForm}
                                            />
                                        </FormField>

                                        {/* CFP section */}
                                        <div className="border-t border-gray-100 pt-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={form.has_cfp} onChange={(e) => setForm({ ...form, has_cfp: e.target.checked })} className="rounded border-gray-300 text-blue-500 focus:ring-blue-400" />
                                                <span className="text-sm font-medium text-gray-700">Tem Call for Papers (CFP)</span>
                                            </label>
                                            {form.has_cfp && (
                                                <div className="mt-3 space-y-3 pl-6">
                                                    <FormField label="URL do CFP *">
                                                        <input type="url" value={form.cfp_href} onChange={(e) => setForm({ ...form, cfp_href: e.target.value })} className="input-field" placeholder="https://..." />
                                                    </FormField>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FormField label="Inicio do CFP">
                                                            <input type="datetime-local" value={form.cfp_begin} onChange={(e) => setForm({ ...form, cfp_begin: e.target.value })} className="input-field" />
                                                        </FormField>
                                                        <FormField label="Fim do CFP">
                                                            <input type="datetime-local" value={form.cfp_end} onChange={(e) => setForm({ ...form, cfp_end: e.target.value })} className="input-field" />
                                                        </FormField>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                                        <button onClick={() => setModalOpen(false)} className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition">Cancelar</button>
                                        <button onClick={handleSave} disabled={saving || !form.title || !form.description} className="rounded-full px-4 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition">
                                            {saving ? "Salvando..." : editingEvent ? "Salvar" : "Criar Evento"}
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>

            {/* ========== DELETE CONFIRMATION MODAL ========== */}
            <Transition.Root show={deleteConfirmOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={() => setDeleteConfirmOpen(false)}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                    </Transition.Child>
                    <div className="fixed inset-0 z-10 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <Dialog.Panel className="relative w-full max-w-sm rounded-2xl bg-white shadow-xl p-6">
                                    <Dialog.Title className="text-base font-semibold text-gray-900 mb-2">Excluir Evento</Dialog.Title>
                                    <p className="text-sm text-gray-500 mb-6">Tem certeza que deseja excluir este evento? Esta acao nao pode ser desfeita.</p>
                                    <div className="flex gap-3 justify-end">
                                        <button onClick={() => setDeleteConfirmOpen(false)} className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition">Cancelar</button>
                                        <button onClick={handleDelete} className="rounded-full px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition">Excluir</button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        </div>
    );
}

// --- Helpers ---

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            {children}
        </div>
    );
}

function formatDateForInput(date: any): string {
    if (!date) return "";
    try {
        return Moment(date).format("YYYY-MM-DDTHH:mm");
    } catch {
        return "";
    }
}

// --- Searchable Venue Picker ---

interface VenuePickerProps {
    venues: VenueType[];
    selectedIds: number[];
    onChange: (ids: number[]) => void;
    inlineVenueOpen: boolean;
    setInlineVenueOpen: (open: boolean) => void;
    inlineVenueForm: VenueFormData;
    setInlineVenueForm: React.Dispatch<React.SetStateAction<VenueFormData>>;
    onInlineCreate: () => void;
    emptyVenueForm: VenueFormData;
}

function VenuePicker({ venues, selectedIds, onChange, inlineVenueOpen, setInlineVenueOpen, inlineVenueForm, setInlineVenueForm, onInlineCreate, emptyVenueForm }: VenuePickerProps) {
    const [query, setQuery] = useState("");

    const selectedVenues = venues.filter((v) => selectedIds.includes(v.ID));

    const filteredVenues = query === ""
        ? venues
        : venues.filter((v) =>
            `${v.alias} ${v.city} ${v.address}`.toLowerCase().includes(query.toLowerCase())
        );

    const handleSelect = (selected: VenueType[]) => {
        onChange(selected.map((v) => v.ID));
        setQuery("");
    };

    const removeVenue = (id: number) => {
        onChange(selectedIds.filter((vid) => vid !== id));
    };

    return (
        <div className="space-y-2">
            <Combobox value={selectedVenues} onChange={handleSelect} multiple>
                <div className="relative">
                    <div className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-blue-400">
                        <div className="flex flex-auto flex-wrap gap-1 items-center">
                            {selectedVenues.map((v) => (
                                <span key={v.ID} className="inline-flex items-center gap-1 rounded-full bg-blue-500 text-white px-2 py-0.5 text-xs font-medium">
                                    <MapPinIcon className="h-3 w-3" />
                                    {v.alias} ({v.city})
                                    <button type="button" onClick={(e) => { e.stopPropagation(); removeVenue(v.ID); }} className="ml-0.5 hover:text-blue-200">
                                        <XMarkIcon className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                            <Combobox.Input
                                className="flex-1 min-w-[120px] bg-transparent border-none p-1 text-sm leading-5 text-gray-900 focus:outline-none focus:ring-0"
                                onChange={(e) => setQuery(e.target.value)}
                                value={query}
                                placeholder={selectedVenues.length === 0 ? "Buscar locais..." : ""}
                            />
                        </div>
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                        </Combobox.Button>
                    </div>
                    <Combobox.Options className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {filteredVenues.length === 0 && query !== "" ? (
                            <div className="relative cursor-default select-none px-4 py-2 text-gray-500 text-sm">
                                Nenhum local encontrado para "{query}"
                            </div>
                        ) : (
                            filteredVenues.map((v) => (
                                <Combobox.Option
                                    key={v.ID}
                                    value={v}
                                    className={({ active }) =>
                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-blue-500 text-white" : "text-gray-900"}`
                                    }
                                >
                                    {({ selected, active }) => (
                                        <>
                                            <div>
                                                <span className={`block truncate ${selected ? "font-semibold" : "font-normal"}`}>
                                                    {v.alias}
                                                </span>
                                                <span className={`block truncate text-xs ${active ? "text-blue-100" : "text-gray-400"}`}>
                                                    {v.city}{v.address ? ` — ${v.address}` : ""}
                                                </span>
                                            </div>
                                            {selected && (
                                                <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? "text-white" : "text-blue-500"}`}>
                                                    <CheckIcon className="h-4 w-4" />
                                                </span>
                                            )}
                                        </>
                                    )}
                                </Combobox.Option>
                            ))
                        )}
                    </Combobox.Options>
                </div>
            </Combobox>

            {!inlineVenueOpen ? (
                <button type="button" onClick={() => setInlineVenueOpen(true)} className="text-xs text-blue-500 hover:underline">
                    + Adicionar novo local
                </button>
            ) : (
                <div className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
                    <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Nome" value={inlineVenueForm.alias} onChange={(e) => setInlineVenueForm({ ...inlineVenueForm, alias: e.target.value })} className="input-field text-xs" />
                        <input type="text" placeholder="Cidade" value={inlineVenueForm.city} onChange={(e) => setInlineVenueForm({ ...inlineVenueForm, city: e.target.value })} className="input-field text-xs" />
                    </div>
                    <input type="text" placeholder="Endereco" value={inlineVenueForm.address} onChange={(e) => setInlineVenueForm({ ...inlineVenueForm, address: e.target.value })} className="input-field text-xs" />
                    <VenueMapPicker
                        lat={inlineVenueForm.lat}
                        long={inlineVenueForm.long}
                        address={inlineVenueForm.address}
                        onLocationChange={(lat, long) => setInlineVenueForm(prev => ({ ...prev, lat, long }))}
                        onCityResolved={(city) => setInlineVenueForm(prev => prev.city ? prev : { ...prev, city })}
                        height={150}
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Latitude" value={inlineVenueForm.lat} onChange={(e) => setInlineVenueForm({ ...inlineVenueForm, lat: e.target.value })} className="input-field text-xs" />
                        <input type="text" placeholder="Longitude" value={inlineVenueForm.long} onChange={(e) => setInlineVenueForm({ ...inlineVenueForm, long: e.target.value })} className="input-field text-xs" />
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={onInlineCreate} className="rounded-full px-3 py-1 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 transition">Criar & Selecionar</button>
                        <button type="button" onClick={() => { setInlineVenueOpen(false); setInlineVenueForm(emptyVenueForm); }} className="rounded-full px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition">Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    );
}
