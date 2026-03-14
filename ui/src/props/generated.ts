/* Do not change, this code is generated from Golang structs */


export interface Cfp {
    ID: number;
    CreatedAt: Time;
    UpdatedAt: Time;
    DeletedAt: DeletedAt;
    event_id: number;
    begin: Time;
    end: Time;
    href: string;
}
export interface Venue {
    ID: number;
    CreatedAt: Time;
    UpdatedAt: Time;
    DeletedAt: DeletedAt;
    alias: string;
    address: string;
    city: string;
    lat: string;
    long: string;
}
export interface Tag {
    ID: number;
    CreatedAt: Time;
    UpdatedAt: Time;
    DeletedAt: DeletedAt;
    tag: string;
}
export interface Attendee {
    ID: number;
    CreatedAt: Time;
    UpdatedAt: Time;
    DeletedAt: DeletedAt;
    FullName: string;
    ContactInfo: string;
    Metadata: any;
    EventID: number;
    UserID: number;
    User: User;
}
export interface Event {
    ID: number;
    CreatedAt: Time;
    UpdatedAt: Time;
    DeletedAt: DeletedAt;
    title: string;
    banner: string;
    description: string;
    href: string;
    type_of: string[];
    begin: Time;
    end: Time;
    user_id: number;
    attendees: Attendee[];
    tags: Tag[];
    venues: Venue[];
    cfp: Cfp;
    user: User;
}
export interface DeletedAt {
    Time: Time;
    Valid: boolean;
}
export interface Time {

}
export interface User {
    ID: number;
    CreatedAt: Time;
    UpdatedAt: Time;
    DeletedAt: DeletedAt;
    Email: string;
    Name: string;
    Role: number;
    Bio: string;
    Avatar: string;
}
export interface Props {
    Environment: string;
    MainTag: string;
    User: User;
    Event: Event;
    Events: Event[];
    Tags: string[];
    TagsList: Tag[];
    Cities: string[];
    Venues: Venue[];
    Users: User[];
}