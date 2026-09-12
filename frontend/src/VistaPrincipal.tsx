import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Badge,
    Button,
    Card,
    Input,
    Modal,
    Select,
    Skeleton,
    Switch,
    Tabs,
    Text,
    Textarea,
    Tooltip,
    MenuButton,
    SearchBar,
    EmptyState,
    useToast,
    useConfirm,
} from '@agnostos/components';
import { Box, Flex } from '@agnostos/layout';
import {
    Plus,
    Pencil,
    Trash2,
    LogOut,
    LogIn,
    RefreshCw,
    Inbox,
    AlertTriangle,
} from 'lucide-react';

import {
    useMsal,
    AuthenticatedTemplate,
    UnauthenticatedTemplate,
} from '@azure/msal-react';
import { loginRequest } from '../authConfig.js';

// ---------------------------------------------------------------------------
// Configuración y tipos
// ---------------------------------------------------------------------------

const API_BASE = 'http://localhost:8089';

interface CategoryResponse {
    id: number;
    name: string;
    description?: string;
    createdAt: string;
}

interface UserResponse {
    id: number;
    name: string;
    email: string;
    active: boolean;
    createdAt: string;
}

interface ItemResponse {
    id: number;
    name: string;
    quantity: number;
    price: number;
    purchased: boolean;
    userId: number;
    createdAt: string;
}

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
    let res: Response;
    try {
        res = await fetch(`${API_BASE}${path}`, {
            headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
            ...options,
        });
    } catch {
        throw new Error('No se pudo conectar con el servidor. Verifica que el gateway esté activo en el puerto 8089.');
    }

    if (!res.ok) {
        let message = `Error ${res.status} al comunicarse con el servidor`;
        try {
            const body = await res.json();
            message = body?.message || body?.error || message;
        } catch {
            // sin cuerpo JSON, se mantiene el mensaje por defecto
        }
        throw new Error(message);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
}

const UsersApi = {
    list: () => apiRequest<UserResponse[]>('/users'),
    create: (data: { name: string; email: string; password: string }) =>
        apiRequest<UserResponse>('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { name: string; email: string }) =>
        apiRequest<UserResponse>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    setStatus: (id: number, active: boolean) =>
        apiRequest<UserResponse>(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ active }) }),
    remove: (id: number) => apiRequest<void>(`/users/${id}`, { method: 'DELETE' }),
};

const ItemsApi = {
    list: () => apiRequest<ItemResponse[]>('/items'),
    create: (data: { name: string; quantity: number; price: number; userId: number }) =>
        apiRequest<ItemResponse>('/items', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { name: string; quantity: number; price: number }) =>
        apiRequest<ItemResponse>(`/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    setPurchased: (id: number, purchased: boolean) =>
        apiRequest<ItemResponse>(`/items/${id}/purchased`, { method: 'PATCH', body: JSON.stringify({ purchased }) }),
    remove: (id: number) => apiRequest<void>(`/items/${id}`, { method: 'DELETE' }),
};

const CategoriesApi = {
    list: () => apiRequest<CategoryResponse[]>('/categories'),
    create: (data: { name: string; description?: string }) =>
        apiRequest<CategoryResponse>('/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { name: string; description?: string }) =>
        apiRequest<CategoryResponse>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: number) => apiRequest<void>(`/categories/${id}`, { method: 'DELETE' }),
};

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return iso;
    }
}

function formatPrice(value: number): string {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'USD' }).format(value);
}

// ---------------------------------------------------------------------------
// Bloques reutilizables
// ---------------------------------------------------------------------------

function PanelHeader({
    title,
    subtitle,
    onNew,
    newLabel,
    onRefresh,
    refreshing,
}: {
    title: string;
    subtitle: string;
    onNew: () => void;
    newLabel: string;
    onRefresh: () => void;
    refreshing: boolean;
}) {
    return (
        <Flex direction={{ xs: 'column', md: 'row' }} justify="between" align={{ md: 'center' }} gap="sm">
            <Box>
                <Text variant="h3" weight="semibold">{title}</Text>
                <Text variant="small" color="muted">{subtitle}</Text>
            </Box>
            <Flex gap="sm">
                <Tooltip content="Recargar datos">
                    <Button variant="ghost" size="sm" icon={RefreshCw} onClick={onRefresh} disabled={refreshing} aria-label="Recargar" />
                </Tooltip>
                <Button variant="primary" size="sm" icon={Plus} onClick={onNew}>
                    {newLabel}
                </Button>
            </Flex>
        </Flex>
    );
}

function ListSkeleton() {
    return (
        <Flex direction="column" gap="sm">
            {[0, 1, 2, 3].map((i) => (
                <Flex key={i} gap="md" align="center">
                    <Skeleton variant="rect" width="100%" height={48} />
                </Flex>
            ))}
        </Flex>
    );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <EmptyState
            icon={AlertTriangle}
            title="No se pudieron cargar los datos"
            description={message}
            action={<Button variant="secondary" icon={RefreshCw} onClick={onRetry}>Reintentar</Button>}
        />
    );
}

function DataTable<T>({
    columns,
    rows,
}: {
    columns: { key: string; header: string; width?: string; align?: 'left' | 'right' | 'center'; render?: (row: T) => React.ReactNode }[];
    rows: T[];
}) {
    return (
        <Box variant="default" shadow="xs" style={{ overflowX: 'auto', borderRadius: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                style={{
                                    textAlign: col.align || 'left',
                                    padding: '12px 16px',
                                    width: col.width,
                                    borderBottom: '1px solid var(--aui-border-color, rgba(128,128,128,0.2))',
                                }}
                            >
                                <Text variant="caption" color="muted" weight="semibold">{col.header}</Text>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row: any, idx) => (
                        <tr key={row.id ?? idx}>
                            {columns.map((col) => (
                                <td
                                    key={col.key}
                                    style={{
                                        textAlign: col.align || 'left',
                                        padding: '12px 16px',
                                        borderBottom: '1px solid var(--aui-border-color, rgba(128,128,128,0.08))',
                                    }}
                                >
                                    {col.render ? col.render(row) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Formularios (usados dentro del Modal)
// ---------------------------------------------------------------------------

function UserForm({
    initial,
    onCancel,
    onSubmit,
    submitting,
}: {
    initial?: UserResponse;
    onCancel: () => void;
    onSubmit: (values: { name: string; email: string; password?: string }) => void;
    submitting: boolean;
}) {
    const isEdit = !!initial;
    const [name, setName] = useState(initial?.name ?? '');
    const [email, setEmail] = useState(initial?.email ?? '');
    const [password, setPassword] = useState('');
    const [touched, setTouched] = useState(false);

    const nameError = touched && name.trim().length < 2;
    const emailError = touched && !/^\S+@\S+\.\S+$/.test(email);
    const passwordError = touched && !isEdit && password.length < 8;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(true);
        if (nameError || emailError || (!isEdit && passwordError)) return;
        onSubmit(isEdit ? { name, email } : { name, email, password });
    };

    return (
        <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="md">
                <Text variant="h3">{isEdit ? 'Editar usuario' : 'Nuevo usuario'}</Text>
                <Box>
                    <Text variant="small" color="muted">Nombre</Text>
                    <Input value={name} onChange={(e) => setName(e.target.value)} error={nameError} placeholder="Ej. Carlos Pérez" />
                </Box>
                <Box>
                    <Text variant="small" color="muted">Correo</Text>
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={emailError}
                        placeholder="correo@dominio.com"
                    />
                </Box>
                {!isEdit && (
                    <Box>
                        <Text variant="small" color="muted">Contraseña</Text>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            error={passwordError}
                            placeholder="Mínimo 8 caracteres"
                        />
                    </Box>
                )}
                <Flex justify="between" gap="sm">
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                    <Button type="submit" variant="primary" disabled={submitting}>
                        {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
                    </Button>
                </Flex>
            </Flex>
        </form>
    );
}

function CategoryForm({
    initial,
    onCancel,
    onSubmit,
    submitting,
}: {
    initial?: CategoryResponse;
    onCancel: () => void;
    onSubmit: (values: { name: string; description?: string }) => void;
    submitting: boolean;
}) {
    const isEdit = !!initial;
    const [name, setName] = useState(initial?.name ?? '');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [touched, setTouched] = useState(false);
    const nameError = touched && (name.trim().length < 2 || name.length > 100);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(true);
        if (nameError) return;
        onSubmit({ name, description: description || undefined });
    };

    return (
        <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="md">
                <Text variant="h3">{isEdit ? 'Editar categoría' : 'Nueva categoría'}</Text>
                <Box>
                    <Text variant="small" color="muted">Nombre</Text>
                    <Input value={name} onChange={(e) => setName(e.target.value)} error={nameError} placeholder="Ej. Lácteos" />
                </Box>
                <Textarea
                    label="Descripción"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción opcional…"
                    autoResize
                />
                <Flex justify="between" gap="sm">
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                    <Button type="submit" variant="primary" disabled={submitting}>
                        {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear categoría'}
                    </Button>
                </Flex>
            </Flex>
        </form>
    );
}

function ItemForm({
    initial,
    users,
    onCancel,
    onSubmit,
    submitting,
}: {
    initial?: ItemResponse;
    users: UserResponse[];
    onCancel: () => void;
    onSubmit: (values: { name: string; quantity: number; price: number; userId?: number }) => void;
    submitting: boolean;
}) {
    const isEdit = !!initial;
    const [name, setName] = useState(initial?.name ?? '');
    const [quantity, setQuantity] = useState(String(initial?.quantity ?? 1));
    const [price, setPrice] = useState(String(initial?.price ?? ''));
    const [userId, setUserId] = useState(initial?.userId ? String(initial.userId) : '');
    const [touched, setTouched] = useState(false);

    const quantityNum = Number(quantity);
    const priceNum = Number(price);
    const nameError = touched && name.trim().length < 1;
    const quantityError = touched && (!Number.isFinite(quantityNum) || quantityNum < 1);
    const priceError = touched && (!Number.isFinite(priceNum) || priceNum < 0);
    const userError = touched && !isEdit && !userId;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(true);
        if (nameError || quantityError || priceError || (!isEdit && userError)) return;
        onSubmit({
            name,
            quantity: quantityNum,
            price: priceNum,
            userId: isEdit ? undefined : Number(userId),
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="md">
                <Text variant="h3">{isEdit ? 'Editar ítem' : 'Nuevo ítem'}</Text>
                <Box>
                    <Text variant="small" color="muted">Nombre</Text>
                    <Input value={name} onChange={(e) => setName(e.target.value)} error={nameError} placeholder="Ej. Leche entera 1L" />
                </Box>
                <Flex gap="md">
                    <Box style={{ flex: 1 }}>
                        <Text variant="small" color="muted">Cantidad</Text>
                        <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} error={quantityError} />
                    </Box>
                    <Box style={{ flex: 1 }}>
                        <Text variant="small" color="muted">Precio</Text>
                        <Input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} error={priceError} />
                    </Box>
                </Flex>
                {!isEdit && (
                    <Select
                        label="Usuario"
                        placeholder="Selecciona un usuario"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        error={userError}
                        options={users.map((u) => ({ value: String(u.id), label: `${u.name} (${u.email})` }))}
                    />
                )}
                <Flex justify="between" gap="sm">
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                    <Button type="submit" variant="primary" disabled={submitting}>
                        {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear ítem'}
                    </Button>
                </Flex>
            </Flex>
        </form>
    );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

type ModalState =
    | { kind: 'closed' }
    | { kind: 'user'; data?: UserResponse }
    | { kind: 'category'; data?: CategoryResponse }
    | { kind: 'item'; data?: ItemResponse };

export default function VistaPrincipal() {
    const toast = useToast();
    const { confirm } = useConfirm();

    const { instance, accounts } = useMsal();
    const currentAccount = accounts[0];

    const handleLogin = useCallback(() => {
        instance.loginRedirect(loginRequest);
    }, [instance]);

    const handleLogout = useCallback(() => {
        instance.logoutRedirect();
    }, [instance]);

    const [users, setUsers] = useState<UserResponse[]>([]);
    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [items, setItems] = useState<ItemResponse[]>([]);

    const [usersLoading, setUsersLoading] = useState(true);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [itemsLoading, setItemsLoading] = useState(true);

    const [usersError, setUsersError] = useState<string | null>(null);
    const [categoriesError, setCategoriesError] = useState<string | null>(null);
    const [itemsError, setItemsError] = useState<string | null>(null);

    const [userSearch, setUserSearch] = useState('');
    const [categorySearch, setCategorySearch] = useState('');
    const [itemSearch, setItemSearch] = useState('');

    const [modal, setModal] = useState<ModalState>({ kind: 'closed' });
    const [submitting, setSubmitting] = useState(false);

    const loadUsers = useCallback(async () => {
        setUsersLoading(true);
        setUsersError(null);
        try {
            setUsers(await UsersApi.list());
        } catch (e: any) {
            setUsersError(e.message);
        } finally {
            setUsersLoading(false);
        }
    }, []);

    const loadCategories = useCallback(async () => {
        setCategoriesLoading(true);
        setCategoriesError(null);
        try {
            setCategories(await CategoriesApi.list());
        } catch (e: any) {
            setCategoriesError(e.message);
        } finally {
            setCategoriesLoading(false);
        }
    }, []);

    const loadItems = useCallback(async () => {
        setItemsLoading(true);
        setItemsError(null);
        try {
            setItems(await ItemsApi.list());
        } catch (e: any) {
            setItemsError(e.message);
        } finally {
            setItemsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
        loadCategories();
        loadItems();
    }, [loadUsers, loadCategories, loadItems]);

    const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

    const filteredUsers = useMemo(
        () =>
            users.filter(
                (u) =>
                    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                    u.email.toLowerCase().includes(userSearch.toLowerCase()),
            ),
        [users, userSearch],
    );

    const filteredCategories = useMemo(
        () => categories.filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase())),
        [categories, categorySearch],
    );

    const filteredItems = useMemo(
        () => items.filter((i) => i.name.toLowerCase().includes(itemSearch.toLowerCase())),
        [items, itemSearch],
    );

    // --- Usuarios --------------------------------------------------------
    const handleUserSubmit = async (values: { name: string; email: string; password?: string }) => {
        setSubmitting(true);
        try {
            if (modal.kind === 'user' && modal.data) {
                await UsersApi.update(modal.data.id, { name: values.name, email: values.email });
                toast.push({ title: 'Usuario actualizado', variant: 'success' });
            } else {
                await UsersApi.create({ name: values.name, email: values.email, password: values.password! });
                toast.push({ title: 'Usuario creado', variant: 'success' });
            }
            setModal({ kind: 'closed' });
            await loadUsers();
        } catch (e: any) {
            toast.push({ title: 'No se pudo guardar el usuario', description: e.message, variant: 'danger' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleUserActive = async (user: UserResponse) => {
        try {
            await UsersApi.setStatus(user.id, !user.active);
            toast.push({ title: user.active ? 'Usuario desactivado' : 'Usuario activado', variant: 'success' });
            await loadUsers();
        } catch (e: any) {
            toast.push({ title: 'No se pudo actualizar el estado', description: e.message, variant: 'danger' });
        }
    };

    const handleDeleteUser = async (user: UserResponse) => {
        const ok = await confirm({
            title: `¿Eliminar a ${user.name}?`,
            description: 'Esta acción no se puede deshacer.',
            variant: 'danger',
            confirmLabel: 'Eliminar',
        });
        if (!ok) return;
        try {
            await UsersApi.remove(user.id);
            toast.push({ title: 'Usuario eliminado', variant: 'success' });
            await loadUsers();
        } catch (e: any) {
            toast.push({ title: 'No se pudo eliminar el usuario', description: e.message, variant: 'danger' });
        }
    };

    // --- Categorías --------------------------------------------------------
    const handleCategorySubmit = async (values: { name: string; description?: string }) => {
        setSubmitting(true);
        try {
            if (modal.kind === 'category' && modal.data) {
                await CategoriesApi.update(modal.data.id, values);
                toast.push({ title: 'Categoría actualizada', variant: 'success' });
            } else {
                await CategoriesApi.create(values);
                toast.push({ title: 'Categoría creada', variant: 'success' });
            }
            setModal({ kind: 'closed' });
            await loadCategories();
        } catch (e: any) {
            toast.push({ title: 'No se pudo guardar la categoría', description: e.message, variant: 'danger' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteCategory = async (category: CategoryResponse) => {
        const ok = await confirm({
            title: `¿Eliminar "${category.name}"?`,
            description: 'Esta acción no se puede deshacer.',
            variant: 'danger',
            confirmLabel: 'Eliminar',
        });
        if (!ok) return;
        try {
            await CategoriesApi.remove(category.id);
            toast.push({ title: 'Categoría eliminada', variant: 'success' });
            await loadCategories();
        } catch (e: any) {
            toast.push({ title: 'No se pudo eliminar la categoría', description: e.message, variant: 'danger' });
        }
    };

    // --- Items --------------------------------------------------------
    const handleItemSubmit = async (values: { name: string; quantity: number; price: number; userId?: number }) => {
        setSubmitting(true);
        try {
            if (modal.kind === 'item' && modal.data) {
                await ItemsApi.update(modal.data.id, { name: values.name, quantity: values.quantity, price: values.price });
                toast.push({ title: 'Ítem actualizado', variant: 'success' });
            } else {
                await ItemsApi.create({ name: values.name, quantity: values.quantity, price: values.price, userId: values.userId! });
                toast.push({ title: 'Ítem creado', variant: 'success' });
            }
            setModal({ kind: 'closed' });
            await loadItems();
        } catch (e: any) {
            toast.push({ title: 'No se pudo guardar el ítem', description: e.message, variant: 'danger' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleTogglePurchased = async (item: ItemResponse) => {
        try {
            await ItemsApi.setPurchased(item.id, !item.purchased);
            await loadItems();
        } catch (e: any) {
            toast.push({ title: 'No se pudo actualizar el ítem', description: e.message, variant: 'danger' });
        }
    };

    const handleDeleteItem = async (item: ItemResponse) => {
        const ok = await confirm({
            title: `¿Eliminar "${item.name}"?`,
            description: 'Esta acción no se puede deshacer.',
            variant: 'danger',
            confirmLabel: 'Eliminar',
        });
        if (!ok) return;
        try {
            await ItemsApi.remove(item.id);
            toast.push({ title: 'Ítem eliminado', variant: 'success' });
            await loadItems();
        } catch (e: any) {
            toast.push({ title: 'No se pudo eliminar el ítem', description: e.message, variant: 'danger' });
        }
    };

    // --- Paneles --------------------------------------------------------

    const usersPanel = (
        <Flex direction="column" gap="md">
            <PanelHeader
                title="Usuarios"
                subtitle={`${users.length} registrados`}
                newLabel="Nuevo usuario"
                onNew={() => setModal({ kind: 'user' })}
                onRefresh={loadUsers}
                refreshing={usersLoading}
            />
            <SearchBar placeholder="Buscar por nombre o correo…" value={userSearch} onChange={setUserSearch} />
            {usersLoading ? (
                <ListSkeleton />
            ) : usersError ? (
                <ErrorState message={usersError} onRetry={loadUsers} />
            ) : filteredUsers.length === 0 ? (
                <EmptyState icon={Inbox} title="Sin usuarios" description="No hay usuarios que coincidan con tu búsqueda." />
            ) : (
                <DataTable
                    columns={[
                        { key: 'name', header: 'Nombre' },
                        { key: 'email', header: 'Correo' },
                        {
                            key: 'active',
                            header: 'Estado',
                            render: (u: UserResponse) => (
                                <Badge variant={u.active ? 'success' : 'default'} dot>
                                    {u.active ? 'Activo' : 'Inactivo'}
                                </Badge>
                            ),
                        },
                        { key: 'createdAt', header: 'Creado', render: (u: UserResponse) => formatDate(u.createdAt) },
                        {
                            key: 'actions',
                            header: '',
                            align: 'right',
                            render: (u: UserResponse) => (
                                <Flex gap="xs" justify="end">
                                    <Tooltip content={u.active ? 'Desactivar' : 'Activar'}>
                                        <Switch checked={u.active} onCheckedChange={() => handleToggleUserActive(u)} aria-label="Alternar estado" />
                                    </Tooltip>
                                    <MenuButton
                                        items={[
                                            { id: 'editar', label: 'Editar', icon: Pencil, onSelect: () => setModal({ kind: 'user', data: u }) },
                                            { id: 'eliminar', label: 'Eliminar', icon: Trash2, onSelect: () => handleDeleteUser(u) },
                                        ]}
                                    />
                                </Flex>
                            ),
                        },
                    ]}
                    rows={filteredUsers}
                />
            )}
        </Flex>
    );

    const categoriesPanel = (
        <Flex direction="column" gap="md">
            <PanelHeader
                title="Categorías"
                subtitle={`${categories.length} registradas`}
                newLabel="Nueva categoría"
                onNew={() => setModal({ kind: 'category' })}
                onRefresh={loadCategories}
                refreshing={categoriesLoading}
            />
            <SearchBar placeholder="Buscar categoría…" value={categorySearch} onChange={setCategorySearch} />
            {categoriesLoading ? (
                <ListSkeleton />
            ) : categoriesError ? (
                <ErrorState message={categoriesError} onRetry={loadCategories} />
            ) : filteredCategories.length === 0 ? (
                <EmptyState icon={Inbox} title="Sin categorías" description="No hay categorías que coincidan con tu búsqueda." />
            ) : (
                <DataTable
                    columns={[
                        { key: 'name', header: 'Nombre' },
                        { key: 'description', header: 'Descripción', render: (c: CategoryResponse) => c.description || '—' },
                        { key: 'createdAt', header: 'Creada', render: (c: CategoryResponse) => formatDate(c.createdAt) },
                        {
                            key: 'actions',
                            header: '',
                            align: 'right',
                            render: (c: CategoryResponse) => (
                                <MenuButton
                                    items={[
                                        { id: 'editar', label: 'Editar', icon: Pencil, onSelect: () => setModal({ kind: 'category', data: c }) },
                                        { id: 'eliminar', label: 'Eliminar', icon: Trash2, onSelect: () => handleDeleteCategory(c) },
                                    ]}
                                />
                            ),
                        },
                    ]}
                    rows={filteredCategories}
                />
            )}
        </Flex>
    );

    const itemsPanel = (
        <Flex direction="column" gap="md">
            <PanelHeader
                title="Ítems"
                subtitle={`${items.length} registrados`}
                newLabel="Nuevo ítem"
                onNew={() => setModal({ kind: 'item' })}
                onRefresh={loadItems}
                refreshing={itemsLoading}
            />
            <SearchBar placeholder="Buscar ítem…" value={itemSearch} onChange={setItemSearch} />
            {itemsLoading ? (
                <ListSkeleton />
            ) : itemsError ? (
                <ErrorState message={itemsError} onRetry={loadItems} />
            ) : filteredItems.length === 0 ? (
                <EmptyState icon={Inbox} title="Sin ítems" description="No hay ítems que coincidan con tu búsqueda." />
            ) : (
                <DataTable
                    columns={[
                        { key: 'name', header: 'Nombre' },
                        { key: 'quantity', header: 'Cant.', align: 'center' },
                        { key: 'price', header: 'Precio', render: (i: ItemResponse) => formatPrice(i.price) },
                        {
                            key: 'userId',
                            header: 'Usuario',
                            render: (i: ItemResponse) => usersById.get(i.userId)?.name ?? `#${i.userId}`,
                        },
                        {
                            key: 'purchased',
                            header: 'Comprado',
                            render: (i: ItemResponse) => (
                                <Tooltip content={i.purchased ? 'Marcar como pendiente' : 'Marcar como comprado'}>
                                    <Switch checked={i.purchased} onCheckedChange={() => handleTogglePurchased(i)} aria-label="Alternar comprado" />
                                </Tooltip>
                            ),
                        },
                        {
                            key: 'actions',
                            header: '',
                            align: 'right',
                            render: (i: ItemResponse) => (
                                <MenuButton
                                    items={[
                                        { id: 'editar', label: 'Editar', icon: Pencil, onSelect: () => setModal({ kind: 'item', data: i }) },
                                        { id: 'eliminar', label: 'Eliminar', icon: Trash2, onSelect: () => handleDeleteItem(i) },
                                    ]}
                                />
                            ),
                        },
                    ]}
                    rows={filteredItems}
                />
            )}
        </Flex>
    );

    return (
        <>
            <UnauthenticatedTemplate>
                <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    gap="lg"
                    style={{ minHeight: '100vh' }}
                >
                    <Card variant="default" shadow="md" style={{ maxWidth: 420, width: '100%', padding: 32 }}>
                        <Flex direction="column" align="center" gap="md">
                            <Text variant="h2" weight="bold">Panel de Administración</Text>
                            <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
                                Debes iniciar sesión con tu cuenta de Microsoft Entra ID para acceder al contenido.
                            </Text>
                            <Button variant="primary" icon={LogIn} onClick={handleLogin}>
                                Iniciar sesión
                            </Button>
                        </Flex>
                    </Card>
                </Flex>
            </UnauthenticatedTemplate>

            <AuthenticatedTemplate>
                <Box padding="lg" style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <Flex direction="column" gap="lg">
                        <Flex direction={{ xs: 'column', md: 'row' }} justify="between" align={{ md: 'center' }} gap="sm">
                            <Box>
                                <Text variant="h1" weight="bold">Panel de Administración</Text>
                                <Text variant="body" color="muted">
                                    Usuarios, categorías e ítems, conectados vía el API Gateway en el puerto 8089.
                                </Text>
                            </Box>
                            <Flex align="center" gap="md">
                                {currentAccount?.name && (
                                    <Text variant="small" color="muted">
                                        {currentAccount.name}
                                    </Text>
                                )}
                                <Button variant="ghost" size="sm" icon={LogOut} onClick={handleLogout}>
                                    Cerrar sesión
                                </Button>
                            </Flex>
                        </Flex>

                        <Tabs
                            items={[
                                { id: 'usuarios', label: 'Usuarios', content: usersPanel },
                                { id: 'items', label: 'Ítems', content: itemsPanel },
                                { id: 'categorias', label: 'Categorías', content: categoriesPanel },
                            ]}
                        />
                    </Flex>

                    <Modal
                        open={modal.kind !== 'closed'}
                        onClose={() => setModal({ kind: 'closed' })}
                        ariaLabel={
                            modal.kind === 'user' ? 'Formulario de usuario' : modal.kind === 'category' ? 'Formulario de categoría' : 'Formulario de ítem'
                        }
                    >
                        {modal.kind === 'user' && (
                            <UserForm
                                initial={modal.data}
                                submitting={submitting}
                                onCancel={() => setModal({ kind: 'closed' })}
                                onSubmit={handleUserSubmit}
                            />
                        )}
                        {modal.kind === 'category' && (
                            <CategoryForm
                                initial={modal.data}
                                submitting={submitting}
                                onCancel={() => setModal({ kind: 'closed' })}
                                onSubmit={handleCategorySubmit}
                            />
                        )}
                        {modal.kind === 'item' && (
                            <ItemForm
                                initial={modal.data}
                                users={users}
                                submitting={submitting}
                                onCancel={() => setModal({ kind: 'closed' })}
                                onSubmit={handleItemSubmit}
                            />
                        )}
                    </Modal>
                </Box>
            </AuthenticatedTemplate>
        </>
    );
}