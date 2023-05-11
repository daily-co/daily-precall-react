# About
<img width="1920" alt="Screenshot 2023-05-11 at 17 33 42" src="https://github.com/daily-co/daily-precall-react/assets/12814720/672d068b-f32d-46d2-82d5-354353ca0857">


Daily Precall React makes it easier to integrate a Daily-based precall workflow into your React app. This repo contains two folders: `daily-precall-react`,
a helper library, and `daily-precall-starterkit`, an example application showing how to use `daily-precall-react` in your own app.

# Running locally 
This repo uses Yarn and Yarn workspaces.
```bash
# clone repo
git clone git@github.com:daily-co/daily-precall-react.git

# install dependencies (do this in the root folder :-))
cd daily-precall-react yarn

# run library
yarn watch-lib

# run starterkit app
yarn watch-app
```
Any changes made in the library will be automatically picked up in the app.

# Installation
```bash
# connection and device checks
yarn install @daily-co/daily-react-precall @daily-co/daily-js @daily-co/daily-react recoil
```

Notice that both `@daily-co/daily-react` and `@daily-co/daily-react-precall` require `@daily-co/daily-js` as a peer dependency, and that
`@daily-co/daily-react` requires `recoil` as a peer dependency.

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
      <DailyTests/>
    </DailyProvider>
  )
}
```

Then inside your `App` include `DailyTestProvider`:

```typescript jsx
import { DailyProvider, useDaily } from '@daily-co/daily-react';
import { DailyTestProvider, useDailyTest, useConnectionTest } from 
'@daily-co/daily-react-precall';

function DailyTests() {
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


# DailyTests
We've set up automatic tests for the library using Jest and React Testing Library. You can run the tests using the following command:

```bash
yarn test
```
