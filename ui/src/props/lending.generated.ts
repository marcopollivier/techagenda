/* Do not change, this code is generated from Golang structs */


export interface DeletedAt {
    Time: Time;
    Valid: boolean;
}
export interface Time {

}
export interface Event {
    ID: number;
    CreatedAt: Time;
    UpdatedAt: Time;
    DeletedAt: DeletedAt;
    Name: string;
    Tags: string[];
    Location: string;
    ScheduleDate: Time;
    OwnerUserID: number;
    ExternalLink: string;
    ID: number;
    CreatedAt: Time;
    UpdatedAt: Time;
    DeletedAt: DeletedAt;
    Email: string;
    Name: string;
    Role: number;
}
export interface Props {
    Events: Event[];
}
export interface IndexRouteProps {
    initialCount: number;
}