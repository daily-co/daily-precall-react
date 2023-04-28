# About

Daily Precall React makes it easier to integrate a Daily-based precall workflow into your React app. This repo contains two folders: `daily-precall-react`,
a helper library, and `daily-react-ui`, an example application showing how to use `daily-precall-react` in your own app.

# Usage

To get started, include the `DailyTest` component in your app:

```typescript jsx
import { DailyTest } from '@daily-co/daily-react-precall';

function App() {
  return (
    <DailyTest callObject={dailyCallObject}>
      {/* … */}
    </DailyTest>
  );
}
```

DailyTest is a component which gives every other component in your application access to test data:

```typescript jsx
import { useDailyTest, useMediaTest } from '@daily-co/daily-precall-react';

export const MicCheck: React.FC = () => {
  const { captureMicReport } = useMediaTest();
  const { testData } = useDailyTest();

  return (
    <>
      <button onClick={captureMicReport} role="button">
        Get information about mic devices
      </button>
      <h1>Results:</h1>
      <p>
        <pre>{JSON.stringify(testData?.mic, null, 2)}</pre>
      </p>
    </>
  );
};
```

# Installation
To do..

# Tests
To do..
