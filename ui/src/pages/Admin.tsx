import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon, MapPinIcon, DocumentTextIcon, UserGroupIcon, ArrowPathIcon, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Props, Event as EventType, Venue as VenueType, Tag as TagType, User as UserType, Attendee as AttendeeType } from "../props/generated";
import { Combobox } from "@headlessui/react";
import { ChevronUpDownIcon, CheckIcon } from "@heroicons/react/20/solid";
import axios from "axios";
import Moment from "moment";
import TechAgendaLogo from "../../public/logo.svg";
import TagPicker from "../molecules/TagPicker";
import VenueMapPicker from "../components/VenueMapPicker";
import MarkdownEditor from "../components/MarkdownEditor";
import { debugLog } from "../lib/debug";

type AdminTab = "events" | "tags" | "venues" | "users";

export default function Admin({ Events, User, Tags, TagsList, Venues, Users, Environment: env }: Props) {
    debugLog(env, 'User:', User, '| Role:', User?.Role ?? 'unknown');

    const [activeTab, setActiveTab] = useState<AdminTab>("events");

    // --- Events state ---
    const [events, setEvents] = useState<EventType[]>(Events ?? []);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<EventType | null>(null);
    const [deletingEventId, setDeletingEventId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attendeesModalEvent, setAttendeesModalEvent] = useState<EventType | null>(null);
    const [cancelledAttendees, setCancelledAttendees] = useState<AttendeeType[]>([]);

    // --- Tags state ---
    const [tagsList, setTagsList] = useState<TagType[]>(TagsList ?? []);
    const [newTagName, setNewTagName] = useState("");

    // --- Venues state ---
    const [venues, setVenues] = useState<VenueType[]>(Venues ?? []);
    const [venueModalOpen, setVenueModalOpen] = useState(false);
    const [editingVenue, setEditingVenue] = useState<VenueType | null>(null);
    const emptyVenueForm: VenueFormData = { alias: "", address: "", city: "", lat: "", long: "" };
    const [venueForm, setVenueForm] = useState<VenueFormData>(emptyVenueForm);

    // --- Users state ---
    const [users, setUsers] = useState<UserType[]>(Users ?? []);
    const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
    const [userSearch, setUserSearch] = useState("");
    const [userPage, setUserPage] = useState(0);
    const usersPerPage = 10;

    // --- User handlers ---
    const handleRoleChange = async (userId: number, newRole: string) => {
        setUpdatingUserId(userId);
        try {
            await axios.put(`/admin/api/users/${userId}/role`, { role: newRole });
            setUsers(users.map((u) => u.ID === userId ? { ...u, Role: newRole } : u));
        } catch (e: any) {
            setError(e?.response?.data?.error ?? "Failed to update role");
        } finally {
            setUpdatingUserId(null);
        }
    };

    // Derived tag names for pickers
    const tagNames = tagsList.map((t) => t.tag);

    // --- Event form ---
    const emptyForm: EventFormData = {
        title: "", banner: "", description: "", href: "",
        type_of: "in_person,online", begin: "", end: "",
        tags: [], venue_ids: [],
        cfp_href: "", cfp_begin: "", cfp_end: "", has_cfp: false,
    };
    const [form, setForm] = useState<EventFormData>(emptyForm);

    // --- Event handlers ---
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
                const resp = await axios.put(`/admin/api/events/${editingEvent.ID}`, payload);
                setEvents(events.map((e) => (e.ID === editingEvent.ID ? resp.data : e)));
            } else {
                const resp = await axios.post("/admin/api/events", payload);
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
            await axios.delete(`/admin/api/events/${deletingEventId}`);
            setEvents(events.filter((e) => e.ID !== deletingEventId));
            setDeleteConfirmOpen(false);
            setDeletingEventId(null);
        } catch (e: any) {
            setError(e?.response?.data?.error ?? "Failed to delete event");
        }
    };

    // --- Attendee handlers ---
    const fetchCancelledAttendees = async (eventId: number) => {
        try {
            const resp = await axios.get(`/admin/api/events/${eventId}/attendees/cancelled`);
            setCancelledAttendees(resp.data ?? []);
        } catch {
            setCancelledAttendees([]);
        }
    };

    const openAttendeesModal = (event: EventType) => {
        setAttendeesModalEvent(event);
        fetchCancelledAttendees(event.ID);
    };

    const handleRemoveAttendee = async (eventId: number, userId: number) => {
        try {
            await axios.delete(`/admin/api/events/${eventId}/attendees/${userId}`);
            const updated = events.map((e) =>
                e.ID === eventId
                    ? { ...e, attendees: (e.attendees ?? []).filter((a) => a.UserID !== userId) }
                    : e
            );
            setEvents(updated);
            const updatedEvent = updated.find((e) => e.ID === eventId);
            if (updatedEvent) setAttendeesModalEvent(updatedEvent);
            fetchCancelledAttendees(eventId);
        } catch (e: any) {
            setError(e?.response?.data?.error ?? "Failed to remove attendee");
        }
    };

    const handleReactivateAttendee = async (eventId: number, userId: number) => {
        try {
            await axios.put(`/admin/api/events/${eventId}/attendees/${userId}/reactivate`);
            // Reload event to get updated attendees list
            const resp = await axios.get(`/admin/api/events/${eventId}`);
            const updatedEvent: EventType = resp.data;
            setEvents(events.map((e) => e.ID === eventId ? updatedEvent : e));
            setAttendeesModalEvent(updatedEvent);
            setCancelledAttendees(cancelledAttendees.filter((a) => a.UserID !== userId));
        } catch (e: any) {
            setError(e?.response?.data?.error ?? "Failed to reactivate attendee");
        }
    };

    // --- Tag handlers ---
    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;
        try {
            const resp = await axios.post("/admin/api/tags", { name: newTagName.trim() });
            setTagsList([...tagsList, resp.data]);
            setNewTagName("");
        } catch (e: any) {
            setError(e?.response?.data?.error ?? "Failed to create tag");
        }
    };

    const handleDeleteTag = async (id: number) => {
        try {
            await axios.delete(`/admin/api/tags/${id}`);
            setTagsList(tagsList.filter((t) => t.ID !== id));
        } catch (e: any) {
            setError(e?.response?.data?.error ?? "Failed to delete tag");
        }
    };

    // --- Venue handlers ---
    const openCreateVenue = () => {
        setEditingVenue(null);
        setVenueForm(emptyVenueForm);
        setVenueModalOpen(true);
    };

    const openEditVenue = (venue: VenueType) => {
        setEditingVenue(venue);
        setVenueForm({
            alias: venue.alias,
            address: venue.address,
            city: venue.city,
            lat: venue.lat,
            long: venue.long,
        });
        setVenueModalOpen(true);
    };

    const handleSaveVenue = async () => {
        setSaving(true);
        try {
            if (editingVenue) {
                const resp = await axios.put(`/admin/api/venues/${editingVenue.ID}`, venueForm);
                setVenues(venues.map((v) => (v.ID === editingVenue.ID ? resp.data : v)));
            } else {
                const resp = await axios.post("/admin/api/venues", venueForm);
                setVenues([...venues, resp.data]);
            }
            setVenueModalOpen(false);
        } catch (e: any) {
            setError(e?.response?.data?.error ?? "Failed to save venue");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteVenue = async (id: number) => {
        try {
            await axios.delete(`/admin/api/venues/${id}`);
            setVenues(venues.filter((v) => v.ID !== id));
        } catch (e: any) {
            setError(e?.response?.data?.error ?? "Failed to delete venue");
        }
    };

    // --- Inline venue creation from event modal ---
    const [inlineVenueOpen, setInlineVenueOpen] = useState(false);
    const [inlineVenueForm, setInlineVenueForm] = useState<VenueFormData>(emptyVenueForm);

    const handleInlineVenueCreate = async () => {
        try {
            const resp = await axios.post("/admin/api/venues", inlineVenueForm);
            const newVenue: VenueType = resp.data;
            setVenues([...venues, newVenue]);
            setForm({ ...form, venue_ids: [...form.venue_ids, newVenue.ID] });
            setInlineVenueOpen(false);
            setInlineVenueForm(emptyVenueForm);
        } catch (e: any) {
            setError(e?.response?.data?.error ?? "Failed to create venue");
        }
    };

    const tabs: { key: AdminTab; label: string }[] = [
        { key: "events", label: "Events" },
        { key: "tags", label: "Tags" },
        { key: "venues", label: "Venues" },
        { key: "users", label: "Users" },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top bar */}
            <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <a href="/"><img className="h-8 w-auto" src={TechAgendaLogo} alt="Tech Agenda" /></a>
                    <span className="text-gray-400">|</span>
                    <span className="text-sm font-semibold text-gray-700">Admin Panel</span>
                </div>
                <div className="flex items-center gap-3">
                    {User && (
                        <>
                            <img className="h-8 w-8 rounded-full" src={User.Avatar} alt={User.Name} />
                            <span className="text-sm text-gray-700">{User.Name}</span>
                        </>
                    )}
                    <a href="/" className="text-sm text-blue-500 hover:underline ml-4">← Back to site</a>
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

                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-gray-100 rounded-full p-1 w-fit">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                                activeTab === tab.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* === EVENTS TAB === */}
                {activeTab === "events" && (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Events Management</h1>
                                <p className="text-sm text-gray-500 mt-1">{events.length} events total</p>
                            </div>
                            <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition">
                                <PlusIcon className="h-4 w-4" /> New Event
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venues</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendees</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CFP</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {events.length === 0 ? (
                                        <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">No events yet. Create your first event!</td></tr>
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
                                            <td className="px-6 py-4 text-sm">
                                                <button
                                                    onClick={() => openAttendeesModal(event)}
                                                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition"
                                                >
                                                    <UserGroupIcon className="h-3.5 w-3.5" />
                                                    <span>{event.attendees?.length ?? 0}</span>
                                                </button>
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
                                                        <PencilSquareIcon className="h-3.5 w-3.5" /> Edit
                                                    </button>
                                                    <button onClick={() => openDelete(event.ID)} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition">
                                                        <TrashIcon className="h-3.5 w-3.5" /> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        </Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* === TAGS TAB === */}
                {activeTab === "tags" && (
                    <>
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-gray-900">Tags Management</h1>
                            <p className="text-sm text-gray-500 mt-1">{tagsList.length} tags total</p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                                    className="input-field flex-1"
                                    placeholder="New tag name..."
                                />
                                <button onClick={handleCreateTag} className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition">
                                    <PlusIcon className="h-4 w-4" /> Add Tag
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                            <div className="flex flex-wrap gap-2 p-6">
                                {tagsList.length === 0 ? (
                                    <p className="text-gray-400 text-sm">No tags yet. Add your first tag above!</p>
                                ) : tagsList.map((tag) => (
                                    <span key={tag.ID} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
                                        {tag.tag}
                                        <button onClick={() => handleDeleteTag(tag.ID)} className="text-blue-400 hover:text-red-500 transition">
                                            <XMarkIcon className="h-3.5 w-3.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* === VENUES TAB === */}
                {activeTab === "venues" && (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Venues Management</h1>
                                <p className="text-sm text-gray-500 mt-1">{venues.length} venues total</p>
                            </div>
                            <button onClick={openCreateVenue} className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition">
                                <PlusIcon className="h-4 w-4" /> New Venue
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {venues.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm">No venues yet.</td></tr>
                                    ) : venues.map((venue) => (
                                        <tr key={venue.ID} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">{venue.alias}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{venue.city}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{venue.address}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => openEditVenue(venue)} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition">
                                                        <PencilSquareIcon className="h-3.5 w-3.5" /> Edit
                                                    </button>
                                                    <button onClick={() => handleDeleteVenue(venue.ID)} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition">
                                                        <TrashIcon className="h-3.5 w-3.5" /> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* === USERS TAB === */}
                {activeTab === "users" && (() => {
                    const filteredUsers = userSearch.trim() === ""
                        ? users
                        : users.filter((u) =>
                            `${u.Name} ${u.Email} ${u.Role || "user"}`.toLowerCase().includes(userSearch.toLowerCase())
                        );
                    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
                    const safePage = Math.min(userPage, totalPages - 1);
                    const paginatedUsers = filteredUsers.slice(safePage * usersPerPage, (safePage + 1) * usersPerPage);

                    return (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    {filteredUsers.length === users.length
                                        ? `${users.length} users total`
                                        : `${filteredUsers.length} of ${users.length} users`
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Search box */}
                        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={userSearch}
                                    onChange={(e) => { setUserSearch(e.target.value); setUserPage(0); }}
                                    className="input-field pl-9"
                                    placeholder="Search by name, email, or role..."
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {paginatedUsers.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm">
                                            {userSearch ? `No users found for "${userSearch}"` : "No users found."}
                                        </td></tr>
                                    ) : paginatedUsers.map((u) => {
                                        const roleName = u.Role || "user";
                                        const isCurrentUser = u.ID === User?.ID;
                                        return (
                                            <tr key={u.ID} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {u.Avatar && (
                                                            <img src={u.Avatar} alt={u.Name} className="h-8 w-8 rounded-full bg-gray-100"
                                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                        )}
                                                        <span className="text-sm font-semibold text-gray-900">{u.Name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{u.Email}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        roleName === "admin" ? "bg-purple-100 text-purple-700" :
                                                        roleName === "mod" ? "bg-blue-100 text-blue-700" :
                                                        "bg-gray-100 text-gray-600"
                                                    }`}>
                                                        {roleName}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {isCurrentUser ? (
                                                        <span className="text-xs text-gray-400">Current user</span>
                                                    ) : (
                                                        <select
                                                            value={roleName}
                                                            disabled={updatingUserId === u.ID}
                                                            onChange={(e) => {
                                                                if (window.confirm(`Change ${u.Name}'s role to "${e.target.value}"?`)) {
                                                                    handleRoleChange(u.ID, e.target.value);
                                                                } else {
                                                                    e.target.value = roleName;
                                                                }
                                                            }}
                                                            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
                                                        >
                                                            <option value="user">user</option>
                                                            <option value="mod">mod</option>
                                                            <option value="admin">admin</option>
                                                        </select>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
                                    <p className="text-xs text-gray-500">
                                        Showing {safePage * usersPerPage + 1}–{Math.min((safePage + 1) * usersPerPage, filteredUsers.length)} of {filteredUsers.length}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setUserPage(safePage - 1)}
                                            disabled={safePage === 0}
                                            className="inline-flex items-center rounded-full p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                        >
                                            <ChevronLeftIcon className="h-4 w-4" />
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setUserPage(i)}
                                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                                                    i === safePage ? "bg-blue-500 text-white" : "text-gray-500 hover:bg-gray-100"
                                                }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setUserPage(safePage + 1)}
                                            disabled={safePage >= totalPages - 1}
                                            className="inline-flex items-center rounded-full p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                        >
                                            <ChevronRightIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                    );
                })()}
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
                                            {editingEvent ? "Edit Event" : "Create New Event"}
                                        </Dialog.Title>
                                        <button onClick={() => setModalOpen(false)} className="rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                                            <XMarkIcon className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                                        {error && (
                                            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
                                        )}

                                        <FormField label="Title *">
                                            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="Event title" />
                                        </FormField>

                                        <FormField label="Banner URL">
                                            <input type="url" value={form.banner} onChange={(e) => setForm({ ...form, banner: e.target.value })} className="input-field" placeholder="https://..." />
                                        </FormField>

                                        <FormField label="Event URL">
                                            <input type="url" value={form.href} onChange={(e) => setForm({ ...form, href: e.target.value })} className="input-field" placeholder="https://..." />
                                        </FormField>

                                        <FormField label="Description *">
                                            <MarkdownEditor value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Event description (supports Markdown)" rows={6} />
                                        </FormField>

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField label="Start Date *">
                                                <input type="datetime-local" value={form.begin} onChange={(e) => setForm({ ...form, begin: e.target.value })} className="input-field" />
                                            </FormField>
                                            <FormField label="End Date *">
                                                <input type="datetime-local" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className="input-field" />
                                            </FormField>
                                        </div>

                                        <FormField label="Type">
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

                                        {/* Venues section — searchable */}
                                        <FormField label="Venues">
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
                                                <span className="text-sm font-medium text-gray-700">Has Call for Papers (CFP)</span>
                                            </label>
                                            {form.has_cfp && (
                                                <div className="mt-3 space-y-3 pl-6">
                                                    <FormField label="CFP URL *">
                                                        <input type="url" value={form.cfp_href} onChange={(e) => setForm({ ...form, cfp_href: e.target.value })} className="input-field" placeholder="https://..." />
                                                    </FormField>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FormField label="CFP Start Date">
                                                            <input type="datetime-local" value={form.cfp_begin} onChange={(e) => setForm({ ...form, cfp_begin: e.target.value })} className="input-field" />
                                                        </FormField>
                                                        <FormField label="CFP End Date">
                                                            <input type="datetime-local" value={form.cfp_end} onChange={(e) => setForm({ ...form, cfp_end: e.target.value })} className="input-field" />
                                                        </FormField>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                                        <button onClick={() => setModalOpen(false)} className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition">Cancel</button>
                                        <button onClick={handleSave} disabled={saving || !form.title || !form.description} className="rounded-full px-4 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition">
                                            {saving ? "Saving..." : editingEvent ? "Save Changes" : "Create Event"}
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
                                    <Dialog.Title className="text-base font-semibold text-gray-900 mb-2">Delete Event</Dialog.Title>
                                    <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this event? This action cannot be undone.</p>
                                    <div className="flex gap-3 justify-end">
                                        <button onClick={() => setDeleteConfirmOpen(false)} className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition">Cancel</button>
                                        <button onClick={handleDelete} className="rounded-full px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition">Delete</button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>

            {/* ========== VENUE CREATE / EDIT MODAL ========== */}
            <Transition.Root show={venueModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={() => setVenueModalOpen(false)}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                    </Transition.Child>
                    <div className="fixed inset-0 z-10 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:scale-95">
                                <Dialog.Panel className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl">
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                        <Dialog.Title className="text-base font-semibold text-gray-900">
                                            {editingVenue ? "Edit Venue" : "Create New Venue"}
                                        </Dialog.Title>
                                        <button onClick={() => setVenueModalOpen(false)} className="rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                                            <XMarkIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <div className="px-6 py-5 space-y-4">
                                        <FormField label="Name *">
                                            <input type="text" value={venueForm.alias} onChange={(e) => setVenueForm({ ...venueForm, alias: e.target.value })} className="input-field" placeholder="Venue name" />
                                        </FormField>
                                        <FormField label="City *">
                                            <input type="text" value={venueForm.city} onChange={(e) => setVenueForm({ ...venueForm, city: e.target.value })} className="input-field" placeholder="City" />
                                        </FormField>
                                        <FormField label="Address">
                                            <input type="text" value={venueForm.address} onChange={(e) => setVenueForm({ ...venueForm, address: e.target.value })} className="input-field" placeholder="Full address" />
                                        </FormField>
                                        <VenueMapPicker
                                            lat={venueForm.lat}
                                            long={venueForm.long}
                                            address={venueForm.address}
                                            onLocationChange={(lat, long) => setVenueForm(prev => ({ ...prev, lat, long }))}
                                            onCityResolved={(city) => setVenueForm(prev => prev.city ? prev : { ...prev, city })}
                                            height={200}
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField label="Latitude">
                                                <input type="text" value={venueForm.lat} onChange={(e) => setVenueForm({ ...venueForm, lat: e.target.value })} className="input-field" placeholder="-23.550520" />
                                            </FormField>
                                            <FormField label="Longitude">
                                                <input type="text" value={venueForm.long} onChange={(e) => setVenueForm({ ...venueForm, long: e.target.value })} className="input-field" placeholder="-46.633308" />
                                            </FormField>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                                        <button onClick={() => setVenueModalOpen(false)} className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition">Cancel</button>
                                        <button onClick={handleSaveVenue} disabled={saving || !venueForm.alias || !venueForm.city} className="rounded-full px-4 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition">
                                            {saving ? "Saving..." : editingVenue ? "Save Changes" : "Create Venue"}
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>

            {/* ========== ATTENDEES MODAL ========== */}
            <Transition.Root show={attendeesModalEvent !== null} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={() => { setAttendeesModalEvent(null); setCancelledAttendees([]); }}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                    </Transition.Child>
                    <div className="fixed inset-0 z-10 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:scale-95">
                                <Dialog.Panel className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[80vh] flex flex-col">
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                        <Dialog.Title className="text-base font-semibold text-gray-900">
                                            Attendees — {attendeesModalEvent?.title}
                                        </Dialog.Title>
                                        <button onClick={() => { setAttendeesModalEvent(null); setCancelledAttendees([]); }} className="rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                                            <XMarkIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <div className="px-6 py-4 overflow-y-auto flex-1">
                                        {/* Active attendees */}
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Active ({attendeesModalEvent?.attendees?.length ?? 0})</h4>
                                        {(!attendeesModalEvent?.attendees || attendeesModalEvent.attendees.length === 0) ? (
                                            <p className="text-sm text-gray-400 text-center py-4">No active attendees for this event.</p>
                                        ) : (
                                            <ul className="divide-y divide-gray-100">
                                                {attendeesModalEvent.attendees.map((a) => (
                                                    <li key={a.ID} className="flex items-center justify-between py-3">
                                                        <div className="flex items-center gap-3">
                                                            {a.User?.Avatar ? (
                                                                <img src={a.User.Avatar} alt={a.User.Name || a.FullName} className="h-8 w-8 rounded-full bg-gray-100"
                                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                            ) : (
                                                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                                    <UserGroupIcon className="h-4 w-4 text-gray-400" />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">{a.User?.Name || a.FullName || "Unknown"}</p>
                                                                {a.User?.Email && (
                                                                    <p className="text-xs text-gray-400">{a.User.Email}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveAttendee(attendeesModalEvent.ID, a.UserID)}
                                                            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition"
                                                        >
                                                            <TrashIcon className="h-3.5 w-3.5" /> Remove
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        {/* Cancelled attendees */}
                                        {cancelledAttendees.length > 0 && (
                                            <>
                                                <div className="border-t border-gray-100 mt-4 pt-4">
                                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Cancelled ({cancelledAttendees.length})</h4>
                                                    <ul className="divide-y divide-gray-100">
                                                        {cancelledAttendees.map((a) => (
                                                            <li key={a.ID} className="flex items-center justify-between py-3 opacity-60">
                                                                <div className="flex items-center gap-3">
                                                                    {a.User?.Avatar ? (
                                                                        <img src={a.User.Avatar} alt={a.User.Name || a.FullName} className="h-8 w-8 rounded-full bg-gray-100 grayscale"
                                                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                                    ) : (
                                                                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                                            <UserGroupIcon className="h-4 w-4 text-gray-400" />
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-500">{a.User?.Name || a.FullName || "Unknown"}</p>
                                                                        {a.User?.Email && (
                                                                            <p className="text-xs text-gray-400">{a.User.Email}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleReactivateAttendee(attendeesModalEvent!.ID, a.UserID)}
                                                                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 transition"
                                                                >
                                                                    <ArrowPathIcon className="h-3.5 w-3.5" /> Reactivate
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100">
                                        <button onClick={() => { setAttendeesModalEvent(null); setCancelledAttendees([]); }} className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition">Close</button>
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

// --- Types ---

interface EventFormData {
    title: string; banner: string; description: string; href: string;
    type_of: string; begin: string; end: string;
    tags: string[]; venue_ids: number[];
    cfp_href: string; cfp_begin: string; cfp_end: string; has_cfp: boolean;
}

interface VenueFormData {
    alias: string; address: string; city: string; lat: string; long: string;
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
                                placeholder={selectedVenues.length === 0 ? "Search venues..." : ""}
                            />
                        </div>
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                        </Combobox.Button>
                    </div>
                    <Combobox.Options className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {filteredVenues.length === 0 && query !== "" ? (
                            <div className="relative cursor-default select-none px-4 py-2 text-gray-500 text-sm">
                                No venues found for "{query}"
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
                    + Add new venue
                </button>
            ) : (
                <div className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
                    <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Name" value={inlineVenueForm.alias} onChange={(e) => setInlineVenueForm({ ...inlineVenueForm, alias: e.target.value })} className="input-field text-xs" />
                        <input type="text" placeholder="City" value={inlineVenueForm.city} onChange={(e) => setInlineVenueForm({ ...inlineVenueForm, city: e.target.value })} className="input-field text-xs" />
                    </div>
                    <input type="text" placeholder="Address" value={inlineVenueForm.address} onChange={(e) => setInlineVenueForm({ ...inlineVenueForm, address: e.target.value })} className="input-field text-xs" />
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
                        <button type="button" onClick={onInlineCreate} className="rounded-full px-3 py-1 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 transition">Create & Select</button>
                        <button type="button" onClick={() => { setInlineVenueOpen(false); setInlineVenueForm(emptyVenueForm); }} className="rounded-full px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition">Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}
