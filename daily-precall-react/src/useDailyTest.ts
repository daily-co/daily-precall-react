import { useContext } from 'react';
import { DailyTestContext } from './DailyTest.tsx';

export const useDailyTest = () => useContext(DailyTestContext);
