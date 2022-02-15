import wd, { Locator } from 'selenium-webdriver'

/* eslint-disable no-empty */

export class SelUtils { // eslint-disable-line import/prefer-default-export
  constructor(private driver: wd.WebDriver) { } // eslint-disable-line no-useless-constructor

  getInnerHtml = (el: wd.WebElement): Promise<string> => el.getAttribute('innerHTML')

  findElementByCss = async (cssSelector: string | Locator, context?: string | wd.WebElement): Promise<wd.WebElement> => {
    const normContext = context ? await this.cssSelectorOrElToEl(context) : this.driver
    return normContext.findElement(typeof cssSelector === 'string' ? By.css(cssSelector) : cssSelector)
  }

  findElementsByCss = async (cssSelector: string, context?: string | wd.WebElement): Promise<wd.WebElement[]> => {
    const normContext = context ? await this.cssSelectorOrElToEl(context) : this.driver
    return normContext.findElements(By.css(cssSelector))
  }

  isDisplayed = async (el: wd.WebElement): Promise<boolean> => {
    try {
      return await el.isDisplayed()
    } catch (e: unknown) { }
    return false
  }

  expectIsDisplayed = async (el: wd.WebElement): Promise<void> => (
    expect(await this.isDisplayed(el)).toBe(true)
  )

  expectNotDisplayed = async (el: wd.WebElement): Promise<void> => (
    expect(await this.isDisplayed(el)).toBe(false)
  )

  doesExists = async (cssSelector: string | Locator, context?: string | wd.WebElement): Promise<boolean> => {
    try {
      await this.findElementByCss(cssSelector, context)
      return true
    } catch (e: unknown) {
      return false
    }
  }

  expectExists = async (cssSelector: string | Locator, context?: string | wd.WebElement): Promise<void> => (
    expect(await this.doesExists(cssSelector, context)).toBe(true)
  )

  expectNotExists = async (cssSelector: string | Locator, context?: string | wd.WebElement): Promise<void> => (
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
}
