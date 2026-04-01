import { useState } from "react";

export function useDialog() {
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const openCreate = () => {
        setEditingId(null);
        setOpen(true);
    };

    const openEdit = (id: string) => {
        setEditingId(id);
        setOpen(true);
    };

    const close = () => {
        setOpen(false);
        setEditingId(null);
    };

    return { open, editingId, openCreate, openEdit, close };
}
