export function scrollToHashWithRetry(hash: string) {
  let attempts = 0;

  const tryScroll = () => {
    const target = document.getElementById(hash.slice(1));

    if (target) {
      target.scrollIntoView({
        behavior: "auto",
        block: "start",
      });

      return;
    }

    attempts += 1;

    if (attempts < 15) {
      setTimeout(tryScroll, 120);
    }
  };

  tryScroll();
}
