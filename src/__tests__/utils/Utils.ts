import wd from 'selenium-webdriver'
import { CommUtils } from './commUtils'
import chrome from 'selenium-webdriver/chrome'
import { SelUtils } from './selUtils'

const screen = {
  width: 1500,
  height: 1000,
}

export const initDriver = async (): Promise<wd.WebDriver> => new Builder()
  .forBrowser('chrome')
  .setChromeOptions(new chrome.Options().windowSize(screen).headless())
  .build()

class Utils {
  private constructor(public driver: wd.WebDriver, public comm: CommUtils, public sel: SelUtils) { // eslint-disable-line @typescript-eslint/no-parameter-properties
  }

  static async init(): Promise<Utils> {
    const driver = await initDriver()
    return new Utils(driver, new CommUtils(driver), new SelUtils(driver))
  }

  async reInit(): Promise<void> {
    this.driver = await initDriver()
    this.comm = new CommUtils(this.driver)
    this.sel = new SelUtils(this.driver)
  }
}

export default Utils
