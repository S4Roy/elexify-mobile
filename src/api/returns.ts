import { api } from './client';

export type ReturnType = 'refund' | 'replacement';

export async function createReturn(params: {
  orderId: string;
  items: { orderItemId: string; quantity: number }[];
  returnType: ReturnType;
  reason: string;
  comment?: string;
  evidence?: string[];
  submissionKey: string;
}): Promise<void> {
  await api.post('site/inventory/order/return', {
    order_id: params.orderId,
    items: params.items.map(item => ({
      order_item_id: item.orderItemId,
      quantity: item.quantity,
    })),
    return_type: params.returnType,
    reason: params.reason,
    ...(params.comment ? { comment: params.comment } : {}),
    ...(params.evidence?.length ? { evidence: params.evidence } : {}),
    submission_key: params.submissionKey,
  });
}
