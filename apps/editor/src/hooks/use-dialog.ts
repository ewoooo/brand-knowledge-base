import { useState, useCallback } from "react";

export function useDialog() {
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const openCreate = useCallback(() => {
        setEditingId(null);
        setOpen(true);
    }, []);

    const openEdit = useCallback((id: string) => {
        setEditingId(id);
        setOpen(true);
    }, []);

    const close = useCallback(() => {
        setOpen(false);
        setEditingId(null);
    }, []);

    return { open, editingId, openCreate, openEdit, close };
}
