# ts-service-locator

The service locator pattern is a pattern to prevent hard dependencies between a component and the services it depends on. See [this Wikipedia article](https://en.wikipedia.org/wiki/Service_locator_pattern) for more information. `ts-service-locator` is a solution to using the service locator pattern, complete with type safety. Use it to register globally-used services and access them from any component. A major advantage this provides is the ability to provide mocked service implementations inside of unit tests.

## The Problem

A major problem with directly importing services in JavaScript components is that it makes unit testing said components more difficult. For example, say you have a component that uses a `logger` service, which is responsible for sending logs to your backend service which then stores log messages in a database. In a unit test, you wouldn't want your component to actually make network calls to your backend.

```ts
// logger.ts
import axios from "axios";

export default {
  log(message: string): void {
    // send the message to the backend
    axios.post("/logger", message);
  },
};
```

```js
// addition-component.ts

import logger from "path/to/logger";

export const addTwo = (num: number): number => {
  logger.log(`Adding two to ${num}`);
  return num + 2;
};
```

This is a bit of a contrived example, but it illustrates the point. Suppose we wanted to write a unit test for `addition-component.js`. With Jest, we could do something like the following:

```js
// addition-component.test.js

import { addTwo } from "path/to/addition-component";

describe("addition component test", () => {
  it("adds two to a number", () => {
    expect(addTwo(3)).toBe(5);
  });
});
```

This unit test will work fine, but it will also log a message to our backend. This isn't ideal, because we don't want our database to get clogged up with a bunch of messages from our unit tests. It should only contain messages from actual use cases of the component.

Using a service locator is one solution to this problem. Instead of `addition-component.ts` `import`ing `logger.ts`, we could create a global object that contains all necessary services. Components could request services from the service locator. That way, the actual services can be registered in the main app, and mock services could be registered in a test environment. A simple service locator could look like the following:

```ts
// service-locator.ts

const services: Record<string, any> = {}

export default {
  set(key: string, service: any): void {
    services[key] = service;
  },
  get(key: string): any|undefined {
    return services[key];
  }
```

At our app's entry point, we can register the actual logger.

```ts
// main.ts
import logger from "path/to/logger";
import sl from "path/to/service-locator";

sl.set("logger", logger);
```

Now we can rewrite `addition-component.ts` to use the service locator pattern:

```ts
// addition-component.ts
import sl from "path/to/service-locator";

const logger = sl.get("logger");

export const addTwo = (num: number): number => {
  if (logger) {
    logger.log(`Adding two to ${num}`);
  } else {
    throw "Logger is not defined";
  }
  return num + 2;
};
```

Now it's much easier to test `addition-component` without it actually making network calls. We can also easily test that the logger is actually logging something:

```ts
// addition-component.test.js

import sl from "path/to/service-locator";

describe("addition component test", () => {
  it("adds two to a number", () => {
    const loggerMock = {
      log: jest.fn(),
    };
    sl.set("logger", loggerMock);
    expect(addTwo(3)).toBe(5);
    expect(loggerMock.log).toHaveBeenCalled();
  });
});
```

Now when `addition-component` calls `sl.get("logger")`, it will receive the mocked logger that was provided in the test.

This is fine, but our service locator has a return type of `any` from the get function. If we're using TypeScript, then we'll lose the Intellisense our editor can provide if we just `import`ed our services directly. One solution is to cast our services like so:

```ts
// addition-component.ts
import sl from "path/to/service-locator";
import logger from "path/to/logger";

const logger: typeof logger = sl.get("logger");

export const addTwo = (num: number): number => {
  if (logger) {
    logger.log(`Adding two to ${num}`);
  } else {
    throw "Logger is not defined";
  }
  return num + 2;
};
```

However, it would be much nicer if TypeScript would automatically know the type of the returned service based on the key passed to the `get` function. This is what `ts-service-locator` solves. All you have to do is define a type with the desired key names for your services and the types of the services that should be associated with those keys, and TypeScript will be aware of your service's type whenever the `get` function is called. See the [Usage section](#usage) for an example.

## Installation

```

\$ npm install ts-service-locator

```

Or if using yarn:

```

\$ yarn add ts-service-locator

```

## Usage

The default export from `ts-service-locator` is a factory function for creating a service locator. If using TypeScript, here you will provide the types that may be registered on the service locator. For example, say we have a global `server` service that handles making API calls to our backend service. We also have a logging service that can log errors.

```js
// sl.js

import createSl from 'ts-service-locator';

const server = {
  fetchUsers: async () => {
    // fetches a list of users from our backend service
    const response = await fetch('/users')
    return response.json()
  }
}

const logger = {
  log: (msg: string) => {
    console.log(msg)
  }
}

type Services = {
  serverService: typeof server;
  loggerService: typeof logger;
}

const sl = createSl<Services>();
sl.set('serverService', server)
sl.set('loggerService', logger)
```

Since you gave `createSl` the `Services` type which only has the keys 'serverService' and 'loggerService', those are the only keys you can use to register services. TypeScript will complain if you try to do something like `sl.set('otherService', other)`.

The same rules apply when you retrieve a service. For example:

```js
// component.js
import sl from "./sl.js";

const server = sl.get("serverService");

if (server) {
  server.fetchUsers().then(console.log);
}
```

TypeScript will complain if you try to `sl.get` a service with a key other than those on the type you used to create the service locator with `createSl`. TypeScript will also know all the methods that exist on `server` because it knows it is of the type of the `server` you registered in `sl.js`.
