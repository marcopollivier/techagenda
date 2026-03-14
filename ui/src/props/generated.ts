/* Do not change, this code is generated from Golang structs */


export interface Cfp {
    ID: string;
    CreatedAt: Time;
    UpdatedAt: Time;
    DeletedAt: DeletedAt;
    event_id: string;
    begin: Time;
    end: Time;
    href: string;
}
export interface Venue {
    ID: string;
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
    ID: string;
    CreatedAt: Time;
    UpdatedAt: Time;
    DeletedAt: DeletedAt;
    tag: string;
}
export interface Attendee {
    ID: string;
    CreatedAt: Time;
    UpdatedAt: Time;
    DeletedAt: DeletedAt;
    FullName: string;
    ContactInfo: string;
    Metadata: any;
    EventID: string;
    UserID: string;
    User: User;
}
export interface Event {
    ID: string;
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
    user_id: string;
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
    ID: string;
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
