import { config } from '../../app/config/env.js';

const uploadedImagePrefix = '/api/v1/product-images/';

export function productImageUrl(reference) {
  return reference?.startsWith(uploadedImagePrefix)
    ? config.apiBaseUrl.replace(/\/$/, '') + reference.slice('/api/v1'.length)
    : reference;
}
