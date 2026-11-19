import type { Address } from '@ecommerce/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AddressForm, AddressLines } from '../../components/AddressForm';
import { Badge, Button, EmptyState, ErrorState, Modal, Skeleton } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api, errorMessage } from '../../lib/api';
import { keys } from '../../lib/queries';
import { Seo } from '../../lib/seo';

export default function AddressesPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { profile } = useAuth();
  const { data, isPending, error, refetch } = useQuery({ queryKey: keys.addresses, queryFn: () => api.get<Address[]>('/me/addresses') });
  const [editing, setEditing] = useState<Address | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Address | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const makeDefault = async (a: Address) => {
    setBusyId(a.id);
    try {
      await api.patch(`/me/addresses/${a.id}`, { is_default: true });
      await qc.invalidateQueries({ queryKey: keys.addresses });
      toast.success('Default address updated');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusyId(deleting.id);
    try {
      await api.del(`/me/addresses/${deleting.id}`);
      await qc.invalidateQueries({ queryKey: keys.addresses });
      toast.success('Address deleted');
      setDeleting(null);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <Seo title="Your addresses" noindex />
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold">Saved addresses</h2>
        {data && data.length > 0 && (
          <Button icon={Plus} size="sm" onClick={() => setEditing('new')}>
            Add address
          </Button>
        )}
      </div>

      {isPending ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-44 rounded-3xl" />
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : data.length === 0 ? (
        <EmptyState icon={MapPin} title="No saved addresses" action={<Button icon={Plus} onClick={() => setEditing('new')}>Add an address</Button>}>
          Save your home or work address for faster checkout.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {data.map((a) => (
            <li key={a.id} className="flex flex-col rounded-3xl bg-white p-5 ring-1 ring-line/70">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {a.label && <Badge tone="forest">{a.label}</Badge>}
                {a.is_default && <Badge tone="success">Default</Badge>}
              </div>
              <AddressLines a={a} />
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                <Button variant="outline" size="sm" icon={Pencil} onClick={() => setEditing(a)}>
                  Edit
                </Button>
                {!a.is_default && (
                  <Button variant="ghost" size="sm" icon={Star} loading={busyId === a.id} onClick={() => void makeDefault(a)}>
                    Set default
                  </Button>
                )}
                <Button variant="ghost" size="sm" icon={Trash2} className="ml-auto text-danger hover:bg-danger-tint" onClick={() => setDeleting(a)} aria-label={`Delete address ${a.label ?? a.line1}`}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add a new address' : 'Edit address'} size="lg">
        {editing !== null && (
          <AddressForm address={editing === 'new' ? null : editing} defaultName={profile?.full_name ?? ''} onSaved={() => setEditing(null)} onCancel={() => setEditing(null)} />
        )}
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete this address?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Keep it
            </Button>
            <Button variant="danger" loading={busyId === deleting?.id} onClick={() => void remove()}>
              Delete
            </Button>
          </>
        }
      >
        {deleting && <AddressLines a={deleting} />}
      </Modal>
    </div>
  );
}
