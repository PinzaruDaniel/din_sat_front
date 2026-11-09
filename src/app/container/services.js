import { createPickupApi } from '../../infrastructure/features/pickup/createPickupApi.js';
import { createPickupActions } from '../../application/features/pickup/createPickupActions.js';
import { config } from '../config/env.js';
import { createHttpClient } from '../../infrastructure/http/createHttpClient.js';
import { createAuthApi } from '../../infrastructure/features/auth/createAuthApi.js';
import { createCatalogApi } from '../../infrastructure/features/catalog/createCatalogApi.js';
import { createProducersApi } from '../../infrastructure/features/producers/createProducersApi.js';
import { createOrdersApi } from '../../infrastructure/features/orders/createOrdersApi.js';
import { createAuthActions } from '../../application/features/auth/createAuthActions.js';
import { createCatalogActions } from '../../application/features/catalog/createCatalogActions.js';
import { createProducersActions } from '../../application/features/producers/createProducersActions.js';
import { createOrdersActions } from '../../application/features/orders/createOrdersActions.js';
import { createDashboardApi } from '../../infrastructure/features/dashboard/createDashboardApi.js';
import { createDashboardActions } from '../../application/features/dashboard/createDashboardActions.js';
import { createAssistantApi } from '../../infrastructure/features/ai/createAssistantApi.js';
import { createAssistantActions } from '../../application/features/ai/createAssistantActions.js';
const http = createHttpClient({ baseUrl: config.apiBaseUrl });
export const services = {
  auth: createAuthActions(createAuthApi(http)),
  catalog: createCatalogActions(createCatalogApi(http)),
  producers: createProducersActions(createProducersApi(http)),
  pickup: createPickupActions(createPickupApi(http)),
  orders: createOrdersActions(createOrdersApi(http)),
  dashboard: createDashboardActions(createDashboardApi(http)),
  assistant: createAssistantActions(createAssistantApi(http)),
};
