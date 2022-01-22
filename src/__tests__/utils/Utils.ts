import wd from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome'
import { CommUtils } from './commUtils'
import { SelUtils } from './selUtils'

const screen = {
  width: 1500,
  height: 1500,
}

export const initDriver = async (isNotHeadless = false): Promise<wd.WebDriver> => {
  const options = new chrome.Options().windowSize(screen)
  if (!isNotHeadless) {
    options.headless()
  }
  return new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build()
}

class Utils {
  private constructor(public driver: wd.WebDriver, public comm: CommUtils, public sel: SelUtils, private isNotHeadless: boolean) {
  }

  static async init(isNotHeadless = false): Promise<Utils> {
    const driver = await initDriver(isNotHeadless)
    return new Utils(driver, new CommUtils(driver), new SelUtils(driver), isNotHeadless)
  }

  async reInit(): Promise<void> {
    await this.driver.quit()
    this.driver = await initDriver(this.isNotHeadless)
    this.comm = new CommUtils(this.driver)
    this.sel = new SelUtils(this.driver)
  }
}

export default Utils
