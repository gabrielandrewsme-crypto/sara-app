import { Finance, FinanceInput } from '../types/database';
import { createCrudService } from './createCrudService';

export const financesService = createCrudService<Finance, FinanceInput>('finances', {
  orderBy: [{ column: 'date', ascending: false }],
});
