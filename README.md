# ts-service-locator

The service locator pattern is a pattern to prevent hard dependencies between a component and the services it depends on. See [this Wikipedia article](https://en.wikipedia.org/wiki/Service_locator_pattern) for more information. `ts-service-locator` is a solution to using the service locator pattern, complete with type safety. Use it to register globally-used services and access them from any component. A major advantage this provides is the ability to provide mocked service implementations inside of unit tests.

## The Problem

Writing a service locator is easy. One can just use a key-value JS object to register and retrieve services by a string name. However, with TypeScript, there will be no way for your editor to know the type of the returned service. For example, say you register a service with the name 'server' and another with the name 'logger'. Both services have different methods. Once you actually retrieve 'server' from the service locator, there will be no way for your editor to know the methods that exist on the returned object. That is what `ts-service-locator` solves. All you have to do is define a type mapping the name of your service to the type of the service, and then once your retrieve your service by name, TypeScript will be aware of the existing properties and methods on the returned service.

## Installation

```
$ npm install ts-service-locator
```

Or if using yarn:

```
$ yarn add ts-service-locator
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
