async function ocap1() {
  return await new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve("Hello, world!");
    }, 500);
  });
}

async function ocap2() {
  return await new Promise<{ fun: typeof ocap1 }>((resolve) => {
    setTimeout(() => {
      resolve({ fun: ocap1 });
    }, 1000);
  });
}

export { ocap1, ocap2 };
