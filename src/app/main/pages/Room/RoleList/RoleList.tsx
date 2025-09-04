'use client'
import { SelectedRoles, useRoomSettings } from "@providers";
import React, { use, useEffect } from "react";
import { Role, ROLES, EVILROLES } from "@types";
import "./styles.css";

const RoleList = ({
    // onChange
}: {
    // onChange: ({ nWofls, selectedRoles }: { nWofls: number; selectedRoles: SelectedRoles[] }) => void;
}) => {

    // const [nWofls, setNWofls] = React.useState<number>(2);
    const { settings: gameSettings, setSettings: setGameSettings } = useRoomSettings();
    const [rolesSelected, setRolesSelected] = React.useState<SelectedRoles[]>([]);

    useEffect(() => {
        let count = 0;
        setRolesSelected(
            ROLES.map((role) => {
                ++count;
                return {
                    name: role,
                    good: checkIfEvil(role),
                    selected: count <= 6 ? true : false,
                };
            })
        )
    }, [])

    const checkIfEvil = (role: Role): boolean => {
        return EVILROLES.includes(role);
    }

    const renderWolfSelectItem = () => {
        return Object.entries(ROLES).map(([key]) => {
            if (key === "werewolf") {
                return (
                    <div key={key} className="sel-wolfs flex items-center">
                        <p>N° Lupi</p>
                        <input type="number" defaultValue={gameSettings.nWolfs} onChange={(e) => setGameSettings({ nWolfs: Number(e.target.value) })} />
                    </div>
                )
            }
        })
    }

    const handleRoleClick = (role: string) => {
        setRolesSelected((prev) => prev.map((r) => r.name === role ? { ...r, selected: !r.selected } : r));
    }

    useEffect(() => {
        setGameSettings({ roles: rolesSelected })
    }, [rolesSelected])

    const renderRoleList = () => {
        return (
            <div>
                <h3>Scegli i ruoli:</h3>
                <div className="role-container">
                    {rolesSelected.map(({ name, selected }) => {
                        if (name !== "narrator" && name !== "villager" && name !== "werewolf") {
                            const roleWithLetterUp = name.charAt(0).toUpperCase() + name.slice(1);
                            return (
                                <div key={name} className="role-item" onClick={() => handleRoleClick(name)}>
                                    <div className={`checkbox ${selected ? "selected" : ""}`} />
                                    {roleWithLetterUp}
                                </div>
                            )
                        }
                    })}
                </div>
            </div>
        )
    }

    return (
        <div>
            {renderWolfSelectItem()}
            {renderRoleList()}
        </div>
    )
}

export default RoleList;