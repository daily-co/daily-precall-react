import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import { renderHook } from '@testing-library/react-hooks';

import { DailyTestProvider } from '../../src';
import { useConnectionTest } from '../../src';

// @TODO: how to make this work?

const createWrapper =
	(
		callObject: DailyCall = DailyIframe.createCallObject(),
	): React.FC<React.PropsWithChildren> =>
	({ children }) =>
		<DailyTestProvider callObject={callObject}>{children}</DailyTestProvider>;

describe('useConnectionTest state', () => {
	it('the test state returns idle by default', async () => {
		const daily = DailyIframe.createCallObject();
		const { result, waitFor } = renderHook(() => useConnectionTest(), {
			wrapper: createWrapper(daily),
		});
		await waitFor(() => {
			expect(result.current.connectionTestState).toBe('idle');
		});
	});
});
