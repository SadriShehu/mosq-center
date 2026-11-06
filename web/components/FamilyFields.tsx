'use client';
import { z } from 'zod';
import type { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { sq } from '@/lib/sq';
import type { Neighbourhood } from '@/lib/types';

export const familySchema = z.object({
  name: z.string().trim().min(1, sq.errors.required),
  middle_name: z.string().optional(),
  surname: z.string().trim().min(1, sq.errors.required),
  members: z
    .number({ error: sq.errors.positive })
    .int(sq.errors.positive)
    .positive(sq.errors.positive),
  neighbourhood_id: z.string().min(1, sq.errors.required),
});

export type FamilyFormValues = z.infer<typeof familySchema>;

export const EMPTY_FAMILY: FamilyFormValues = {
  name: '',
  middle_name: '',
  surname: '',
  members: 0,
  neighbourhood_id: '',
};

/** The shared add/edit family form fields (Dialog only). */
export function FamilyFields({
  form, neighbourhoods, idPrefix,
}: {
  form: UseFormReturn<FamilyFormValues>;
  neighbourhoods: Neighbourhood[];
  idPrefix: string;
}) {
  const { errors } = form.formState;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor={`${idPrefix}-name`}>{sq.fields.name}</Label>
        <Input id={`${idPrefix}-name`} {...form.register('name')} />
        {errors.name && <p role="alert" className="mt-1 text-sm text-danger">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-parent`}>{sq.fields.parentName}</Label>
        <Input id={`${idPrefix}-parent`} {...form.register('middle_name')} />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-surname`}>{sq.fields.surname}</Label>
        <Input id={`${idPrefix}-surname`} {...form.register('surname')} />
        {errors.surname && <p role="alert" className="mt-1 text-sm text-danger">{errors.surname.message}</p>}
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-members`}>{sq.fields.memberCount}</Label>
        <Input id={`${idPrefix}-members`} type="number" {...form.register('members', { valueAsNumber: true })} />
        {errors.members && <p role="alert" className="mt-1 text-sm text-danger">{errors.members.message}</p>}
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-neighbourhood`}>{sq.fields.neighbourhood}</Label>
        <Select id={`${idPrefix}-neighbourhood`} {...form.register('neighbourhood_id')}>
          <option value="" disabled>{sq.fields.selectNeighbourhood}</option>
          {neighbourhoods.map((n) => (
            <option key={n.id} value={n.id}>{n.name}</option>
          ))}
        </Select>
        {errors.neighbourhood_id && (
          <p role="alert" className="mt-1 text-sm text-danger">{errors.neighbourhood_id.message}</p>
        )}
      </div>
    </div>
  );
}
