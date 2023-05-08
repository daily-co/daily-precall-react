# About

Daily Precall React makes it easier to integrate a Daily-based precall workflow into your React app. This repo contains two folders: `daily-precall-react`,
a helper library, and `daily-precall-starterkit`, an example application showing how to use `daily-precall-react` in your own app.

# Usage
You'll need to install both `daily-precall-react` and [`daily-react`](https://docs.daily.co/reference/daily-react) since you'll need access to a `callObject` in order
to run the tests. You can get started by first including [`DailyProvider`](https://docs.daily.co/reference/daily-react/daily-provider) in your app:

```typescript jsx
import { useEffect, useState } from 'react';
import { DailyProvider } from '@daily-co/daily-react';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';

function App() {
  const [callObject, setCallObject] = useState<null>(null);
    // Create call object
    useEffect(() => {
      const co = DailyIframe.createCallObject();
      setCallObject(co);

    return () => {
      setCallObject(null);
    };
  }, []);
  
  return (
    <DailyProvider callObject={callObject}>
      <Tests/>
    </DailyProvider>
  )
}
```

Then inside your `App` include `DailyTestProvider`:

```typescript jsx
import { DailyProvider, useDaily } from '@daily-co/daily-react';
import { DailyTestProvider, useDailyTest, useConnectionTest } from 
'@daily-co/daily-react-precall';

function Tests() {
  const callObject = useDaily();
  const { testData } = useDailyTest();
  const { startConnectionTest } = useConnectionTest();

 return (
    <DailyTestProvider callObject={callObject}>
      <>
        <button onClick={() => startConnectionTest()}>Start test</button>
        <h1>Raw results</h1>
        <pre>{JSON.stringify(testData?.connection, null, 2)}</pre>
      </>
    </DailyTestProvider>
  )
}
```
Learn more about Daily Precall React by reading our docs at [TODO].

# Installation
```bash
# connection and device checks
yarn install @daily-co/daily-react-precall @daily-co/daily-js @daily-co/daily-react recoil
```

Notice that both `@daily-co/daily-react` and `@daily-co/daily-react-precall` require `@daily-co/daily-js` as a peer dependency, and that
`@daily-co/daily-react` requires `recoil` as a peer dependency.


# Tests
Soon..
