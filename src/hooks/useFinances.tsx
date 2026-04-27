import { financesService } from '../services/financesService';
import { Finance, FinanceInput } from '../types/database';
import { createResourceHook } from './createResourceHook';

const { Provider, useResource } = createResourceHook<Finance, FinanceInput>(
  financesService,
);

export const FinancesProvider = Provider;
export const useFinances = useResource;
