import { useMutation } from '@tanstack/react-query';
import { submitContactUs } from '../../api/cms';

export function useSubmitContactUs() {
  return useMutation({ mutationFn: submitContactUs });
}
