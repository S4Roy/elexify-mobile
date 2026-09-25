jest.mock('../src/api/client', () => ({
  api: { get: jest.fn(), put: jest.fn(), post: jest.fn() },
}));

import { api } from '../src/api/client';
import { fetchAddresses, fetchCities, fetchStates, lookupPincode, reverseGeocode, saveAddress } from '../src/api/address';

test('editing an address clears optional fields when they are emptied', async () => {
  (api.put as jest.Mock).mockResolvedValue({ data: {} });

  await saveAddress({
    id: 'address-1',
    firstName: 'Subhankar',
    lastName: 'Roy',
    phone: '8906787168',
    email: '',
    postcode: '700160',
    addressLine1: 'Action Area I',
    addressLine2: '',
    landMark: '',
    city: 1,
    state: 2,
  });

  expect(api.put).toHaveBeenCalledWith('user/address/edit', expect.objectContaining({
    _id: 'address-1',
    email: '',
    address_line_2: '',
    land_mark: '',
  }));
});

test('manual address lookup uses the country and state master routes', async () => {
  (api.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: 19, name: 'West Bengal' }] } });
  await expect(fetchStates(101)).resolves.toEqual([{ id: 19, name: 'West Bengal' }]);
  expect(api.get).toHaveBeenCalledWith('site/common/states/101', { signal: undefined });

  (api.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: 29, name: 'Kolkata' }] } });
  await expect(fetchCities(19)).resolves.toEqual([{ id: 29, name: 'Kolkata' }]);
  expect(api.get).toHaveBeenCalledWith('site/common/cities/19', { signal: undefined });
});

test('reverse geocoding returns the pincode and suggested address from the web endpoint', async () => {
  (api.get as jest.Mock).mockResolvedValue({ data: { data: {
    found: true,
    serviceable: true,
    pincode: '700160',
    city: { id: 29, name: 'Kolkata' },
    state: { id: 19, name: 'West Bengal' },
    suggested_address_line_1: 'Action Area I',
    suggested_address_line_2: 'New Town',
  } } });

  await expect(reverseGeocode(22.58, 88.47)).resolves.toEqual(expect.objectContaining({
    pincode: '700160',
    city: { id: 29, name: 'Kolkata' },
    suggestedAddressLine1: 'Action Area I',
    suggestedAddressLine2: 'New Town',
  }));
  expect(api.get).toHaveBeenCalledWith('site/common/reverse-geocode', {
    params: { lat: 22.58, lng: 88.47 },
  });
});

test('saved city name remains available when the city master record is missing', async () => {
  (api.get as jest.Mock).mockResolvedValue({ data: { data: { docs: [{
    _id: 'address-1', full_name: 'Subhankar Roy', postcode: '743376',
    city: null, city_name: 'South 24 Parganas',
    state: { id: 19, name: 'West Bengal' },
  }], totalDocs: 1, hasNextPage: false } } });

  const addresses = await fetchAddresses();
  expect(addresses.items[0].city).toEqual({ id: null, name: 'South 24 Parganas' });
});

test('pincode lookup keeps a source city suggestion when no city ID was mapped', async () => {
  (api.get as jest.Mock).mockResolvedValue({ data: { data: {
    found: true, serviceable: true, city: null,
    state: { id: 19, name: 'West Bengal' },
    suggested_city_name: 'South 24 Parganas',
  } } });

  await expect(lookupPincode('743376')).resolves.toEqual(expect.objectContaining({
    city: null,
    suggestedCityName: 'South 24 Parganas',
  }));
});

test('saveAddress returns the id so checkout can select the saved address', async () => {
  const input = {
    firstName: 'Riya', lastName: 'Sen', phone: '9876543210', postcode: '700091',
    addressLine1: 'Flat 4B, Green Tower', city: 1, state: 2,
  };
  (api.post as jest.Mock).mockResolvedValue({ data: { data: { _id: 'new-address' } } });
  await expect(saveAddress(input)).resolves.toBe('new-address');

  (api.put as jest.Mock).mockResolvedValue({ data: {} });
  await expect(saveAddress({ ...input, id: 'existing' })).resolves.toBe('existing');

  (api.post as jest.Mock).mockResolvedValue({ data: {} });
  await expect(saveAddress(input)).resolves.toBeNull();
});
