import wd from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome'
import { CommUtils } from './commUtils'
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
  private constructor(public driver: wd.WebDriver, public comm: CommUtils, public sel: SelUtils) {
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
