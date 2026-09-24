import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { fetchInvoicePdf } from '../../api/order';

// Downloads the order's receipt PDF (authenticated via the shared `api`
// client, same as every other request) and hands it to the native share
// sheet so the customer can save/open/send it — there is no in-app PDF
// viewer, matching the web storefront's own "download, don't preview"
// behavior for this feature.
export async function downloadAndShareInvoice(orderId: string, orderNumber: string): Promise<void> {
  const bytes = await fetchInvoicePdf(orderId);
  const dir = new Directory(Paths.cache, 'invoices');
  dir.create({ intermediates: true, idempotent: true });
  const file = new File(dir, `Receipt-${orderNumber.replace(/\//g, '-')}.pdf`);
  file.create({ overwrite: true });
  file.write(new Uint8Array(bytes));

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: `Receipt ${orderNumber}` });
}
