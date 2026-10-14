jest.mock('../src/api/client', () => ({
  api: { put: jest.fn(), post: jest.fn() },
  ApiError: class ApiError extends Error {},
}));
import { api } from '../src/api/client';
import { updateProfile } from '../src/api/account';
import { verifyOtp } from '../src/api/auth';
import { saveAddress } from '../src/api/address';
import { isEnglishCustomerName } from '../src/utils/customer-name';

test('profile, signup and addresses reject non-English names before sending requests', async () => {
  await expect(updateProfile({ firstName: 'রাহুল' })).rejects.toThrow('English');
  await expect(verifyOtp({ mobile: '9876543210', otp: '123456', firstName: 'राहुल' })).rejects.toThrow('English');
  await expect(saveAddress({ firstName: 'Asha', lastName: 'রায়', phone: '9876543210',
    addressLine1: '12 Main Road', city: 1, state: 2, postcode: '700001' })).rejects.toThrow('English');
  expect(api.put).not.toHaveBeenCalled();
  expect(api.post).not.toHaveBeenCalled();
});
test('correcting a name permits an empty last name', async () => {
  (api.put as jest.Mock).mockResolvedValue({});
  await updateProfile({ firstName: 'Asha', lastName: '' });
  expect(api.put).toHaveBeenCalledWith('user/account/edit', { first_name: 'Asha', last_name: '' });
});
test.each(['Asha Roy', "O'Connor", 'Anne-Marie', 'J. Smith'])('accepts %s', name => {
  expect(isEnglishCustomerName(name)).toBe(true);
});
test.each(['রাহুল', 'राहुल', 'José', 'Asha123', '---'])('rejects %s', name => {
  expect(isEnglishCustomerName(name)).toBe(false);
});
