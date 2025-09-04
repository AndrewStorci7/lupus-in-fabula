// import { GameSettings, isGameSettings } from "@models/GameRoom";
import { RoomSettingsType, isRoomSettingsType, SelectedRoles } from "@providers";
import { DEFAULTROLES, Role } from "@types";
import React, { useEffect } from "react";

const List = ({ items }: { items: RoomSettingsType | string[] }) => {

    const [_items, _setItems] = React.useState<RoomSettingsType | string[]>(items);

    useEffect(() => {
        _setItems(items);
    }, [items])

    const renderItemsList = () => {
        if (isRoomSettingsType(_items)) {
            return Object.entries(_items).map(([key, value], roleIndex) => {
                if (key === "roles" && Array.isArray(value)) {
                    return (
                        <li key={key}>Ruoli scelti: {
                            Object.values(value).map((element: SelectedRoles, index: number, arr: Role[]) => {
                                const isLast = index === arr.length - 1;
                                return element.selected && !DEFAULTROLES.includes(element.name) ? <b key={index}>{element.name}{isLast ? '' : ', '}</b> : null;
                            })
                        }</li>
                    );
                } else {
                    return <li key={roleIndex}>{key}: <b>{value === 0 ? "Nessun Limite" : value}</b></li>;
                }
            });
        } else {
            return (_items as string[]).map((item, index) => <li key={index}>{item}</li>);
        }
    }

    return <ul>{renderItemsList()}</ul>;
}

export default List;