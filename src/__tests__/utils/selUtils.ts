import wd from 'selenium-webdriver'

export class SelUtils { // eslint-disable-line import/prefer-default-export
  constructor(private driver: wd.WebDriver) { } // eslint-disable-line no-useless-constructor

  getTextContUntrimmed = (el: wd.WebElement): Promise<string> => el.getAttribute('textContent')

  getInnerHtml = (el: wd.WebElement): Promise<string> => el.getAttribute('innerHTML')

  findElementByCss = async (cssSelector: string, context?: string | wd.WebElement): Promise<wd.WebElement> => {
    const normContext = context ? await this.cssSelectorOrElToEl(context) : this.driver
    return normContext.findElement(By.css(cssSelector))
  }

  findElementsByCss = async (cssSelector: string, context?: string | wd.WebElement): Promise<wd.WebElement[]> => {
    const normContext = context ? await this.cssSelectorOrElToEl(context) : this.driver
    return normContext.findElements(By.css(cssSelector))
  }

  doesExists = async (cssSelector: string, context?: string | wd.WebElement): Promise<boolean> => {
    try {
      await this.findElementByCss(cssSelector, context)
      return true
    } catch (e: unknown) {
      return false
    }
  }

  expectExists = async (cssSelector: string, context?: string | wd.WebElement): Promise<void> => (
    expect(await this.doesExists(cssSelector, context)).toBe(true)
  )

  expectNotExists = async (cssSelector: string, context?: string | wd.WebElement): Promise<void> => (
    expect(await this.doesExists(cssSelector, context)).toBe(false)
  )

  private cssSelectorOrElToEl = async (cssSelectorOrEl: string | wd.WebElement): Promise<wd.WebElement> => {
    if (typeof cssSelectorOrEl === 'string') {
      return this.findElementByCss(cssSelectorOrEl)
    }
    return cssSelectorOrEl
  }

  expectContainsText = async (cssSelectorOrEl: string | wd.WebElement, text: string): Promise<void> => {
    const el = await this.cssSelectorOrElToEl(cssSelectorOrEl)
    expect(await el.getText()).toContain(text)
  }

  expectNotContainsText = async (cssSelectorOrEl: string | wd.WebElement, text: string): Promise<void> => {
    const el = await this.cssSelectorOrElToEl(cssSelectorOrEl)
    expect(await el.getText()).not.toContain(text)
  }

  waitUntilClickable = async (cssSelectorOrEl: string | wd.WebElement, timeout = 100): Promise<wd.WebElement> => {
    const el = await this.cssSelectorOrElToEl(cssSelectorOrEl)
    await this.driver.wait(wd.until.elementIsVisible(el), timeout)
    await this.driver.wait(wd.until.elementIsEnabled(el), timeout)
    return el
  }

  private sendRepeatedKeys = async (
    cssSelectorOrEl: string | wd.WebElement, numOfPos: number, arrowKeyCode: string,
  ): Promise<void> => {
    const el = await this.cssSelectorOrElToEl(cssSelectorOrEl)
    await el.sendKeys(...new Array(numOfPos).fill(arrowKeyCode))
  }

  arrowDown = async (cssSelectorOrEl: string | wd.WebElement, numOfPos = 1): Promise<void> => (
    this.sendRepeatedKeys(cssSelectorOrEl, numOfPos, Key.ARROW_DOWN)
  )
}
