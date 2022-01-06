import wd from 'selenium-webdriver';

declare global {
  const By: typeof wd.By;
  const Builder: typeof wd.Builder;
  const until: typeof wd.until;
  const Key: typeof wd.Key;
}
