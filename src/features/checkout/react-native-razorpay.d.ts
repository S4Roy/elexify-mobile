declare module 'react-native-razorpay' {
  export type RazorpayOptions = {
    key: string;
    order_id: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    image?: string;
    prefill?: { name?: string; email?: string; contact?: string };
    theme?: { color?: string };
  };
  export type RazorpaySuccess = {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  };
  export type RazorpayError = { code: number; description: string };
  const RazorpayCheckout: {
    open(options: RazorpayOptions): Promise<RazorpaySuccess>;
  };
  export default RazorpayCheckout;
}
