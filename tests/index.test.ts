import createSl from "../src";

const mockServer = {
  fetchUsers: jest.fn(),
};

type TestType = {
  server: typeof mockServer;
};

describe("service locator test", () => {
  it("returns nothing when nothing is registered", () => {
    const sl = createSl<TestType>();
    const server = sl.get("server");
    expect(server).toBeUndefined();
  });

  it("returns registered service", () => {
    const sl = createSl<TestType>();
    sl.set("server", mockServer);

    const server = sl.get("server");
    if (server) {
      server.fetchUsers();
      expect(mockServer.fetchUsers).toHaveBeenCalled();
    }
  });
});
