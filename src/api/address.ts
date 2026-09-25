import { api } from './client';
import { Page, record, string } from './discovery';

const number = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

export type MasterRef = { id: number | null; name: string };

export type Address = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phoneCode: string;
  phone: string;
  email: string | null;
  addressLine1: string;
  addressLine2: string;
  landMark: string;
  city: MasterRef;
  state: MasterRef;
  country: MasterRef;
  postcode: string;
  addressType: string;
  isDefault: boolean;
};

function parseMaster(value: unknown): MasterRef {
  if (typeof value === 'number') {
    return { id: value, name: '' };
  }
  const r = record(value);
  return { id: number(r.id), name: string(r.name) };
}

function parseAddress(value: unknown): Address | null {
  const a = record(value);
  const id = string(a._id);
  if (!id) {
    return null;
  }
  const fullName = string(a.full_name);
  const [firstName, ...rest] = fullName.trim().split(/\s+/);
  const city = parseMaster(a.city);
  const state = parseMaster(a.state);
  const country = parseMaster(a.country);
  return {
    id,
    fullName,
    firstName: firstName || '',
    lastName: rest.join(' '),
    phoneCode: string(a.phone_code) || '91',
    phone: string(a.phone),
    email: string(a.email) || null,
    addressLine1: string(a.address_line_1),
    addressLine2: string(a.address_line_2),
    landMark: string(a.land_mark),
    city: { ...city, name: city.name || string(a.city_name) },
    state: { ...state, name: state.name || string(a.state_name) },
    country: { ...country, name: country.name || string(a.country_name) },
    postcode: string(a.postcode),
    addressType: string(a.address_type) || 'home',
    isDefault: a.is_default === true,
  };
}

export async function fetchAddresses(
  page = 1,
  signal?: AbortSignal,
): Promise<Page<Address>> {
  const limit = 20;
  const res = await api.get('user/address/list', {
    params: { page, limit },
    signal,
  });
  const d = record(res.data?.data);
  const docs = Array.isArray(d.docs) ? d.docs : [];
  const items: Address[] = [];
  for (const doc of docs) {
    const address = parseAddress(doc);
    if (address) {
      items.push(address);
    }
  }
  const total = number(d.totalDocs) ?? items.length;
  const totalPages = number(d.totalPages);
  const more =
    d.hasNextPage === true ||
    (d.hasNextPage !== false &&
      (totalPages !== null ? page < totalPages : items.length === limit));
  return {
    items,
    total,
    nextPage: more && items.length > 0 ? page + 1 : undefined,
  };
}

export type AddressInput = {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  landMark?: string;
  city: number;
  state: number;
  country?: number;
  postcode: string;
  addressType?: string;
  isDefault?: boolean;
  latitude?: number;
  longitude?: number;
};

function addressPayload(input: AddressInput) {
  return {
    first_name: input.firstName,
    last_name: input.lastName,
    phone_code: '91',
    phone: input.phone,
    email: input.email ?? '',
    address_line_1: input.addressLine1,
    address_line_2: input.addressLine2 ?? '',
    land_mark: input.landMark ?? '',
    city: input.city,
    state: input.state,
    country: input.country ?? 101,
    postcode: input.postcode,
    address_type: input.addressType || 'home',
    is_default: input.isDefault ?? false,
    ...(input.latitude != null && input.longitude != null
      ? { latitude: input.latitude, longitude: input.longitude }
      : {}),
  };
}

/** Creates or updates an address and returns its id — for a new address the
 * backend returns the saved document (or the identical one already on file). */
export async function saveAddress(input: AddressInput): Promise<string | null> {
  if (input.id) {
    await api.put('user/address/edit', { _id: input.id, ...addressPayload(input) });
    return input.id;
  }
  const res = await api.post('user/address/add', addressPayload(input));
  return string(record(res.data?.data)._id) || null;
}

export async function setDefaultAddress(id: string): Promise<void> {
  await api.put('user/address/edit', { _id: id, is_default: true });
}

export async function deleteAddress(id: string): Promise<void> {
  await api.delete('user/address/delete', { data: { _id: id } });
}

export type PincodeResult = {
  found: boolean;
  serviceable: boolean;
  city: MasterRef | null;
  state: MasterRef | null;
  country: MasterRef | null;
  suggestedCityName?: string;
};

export type ReverseGeocodeResult = PincodeResult & {
  pincode: string;
  suggestedAddressLine1: string;
  suggestedAddressLine2: string;
};

export async function reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult> {
  const res = await api.get('site/common/reverse-geocode', { params: { lat: latitude, lng: longitude } });
  const d = record(res.data?.data);
  const master = (value: unknown): MasterRef | null => {
    const item = parseMaster(value);
    return item.id !== null ? item : null;
  };
  return {
    found: d.found === true,
    serviceable: d.serviceable === true,
    pincode: string(d.pincode),
    city: master(d.city),
    state: master(d.state),
    country: master(d.country),
    suggestedCityName: string(d.suggested_city_name),
    suggestedAddressLine1: string(d.suggested_address_line_1),
    suggestedAddressLine2: string(d.suggested_address_line_2),
  };
}

async function fetchMasterList(path: string, signal?: AbortSignal): Promise<MasterRef[]> {
  const res = await api.get(path, { signal });
  const data = res.data?.data;
  return Array.isArray(data)
    ? data.map(parseMaster).filter((item): item is MasterRef & { id: number } => item.id !== null)
    : [];
}

export const fetchStates = (countryId: number, signal?: AbortSignal) =>
  fetchMasterList(`site/common/states/${countryId}`, signal);

export const fetchCities = (stateId: number, signal?: AbortSignal) =>
  fetchMasterList(`site/common/cities/${stateId}`, signal);

export async function lookupPincode(
  postcode: string,
  signal?: AbortSignal,
): Promise<PincodeResult> {
  const res = await api.get(`site/common/pincode/${encodeURIComponent(postcode)}`, {
    signal,
  });
  const d = record(res.data?.data);
  const master = (v: unknown): MasterRef | null => {
    const m = parseMaster(v);
    return m.id !== null ? m : null;
  };
  return {
    found: d.found === true,
    serviceable: d.serviceable === true,
    city: master(d.city),
    state: master(d.state),
    country: master(d.country),
    suggestedCityName: string(d.suggested_city_name),
  };
}
