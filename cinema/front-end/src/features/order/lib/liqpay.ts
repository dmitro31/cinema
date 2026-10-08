import type { Checkout } from '../types';

const LIQPAY_CHECKOUT_URL = 'https://www.liqpay.ua/api/3/checkout';

export function submitLiqPayForm(checkout: Checkout) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.acceptCharset = 'utf-8';
  form.style.display = 'none';
  form.action = checkout.checkoutUrl ?? checkout.url ?? checkout.action ?? LIQPAY_CHECKOUT_URL;

  const fields: [string, string][] = [
    ['data', checkout.data],
    ['signature', checkout.signature],
  ];

  for (const [name, value] of fields) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}