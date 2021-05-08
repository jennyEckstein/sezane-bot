"use strict";

const puppeteer = require("puppeteer");
const md5 = require("md5");

let prevHash = md5("foo");
let prevState = "foo";

async function saleDropped() {
  const stateChange = [];

  // Set up web page
  const browser = await puppeteer.launch({
    headless: true,
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--disable-gpu", "--disable-extensions"],
  });
  const context = await browser.createIncognitoBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36"
  );

  const navigationPromise = page.waitForNavigation({
    waitUntil: ["networkidle2"],
  });

  // Load website
  await page.goto("http://sezane.com/fr", { waitUntil: "networkidle2" });

  // Click on Archive section
  const ARCHIVE_SELECTOR = "#submenu-trigger-5";
  await page.waitForSelector(ARCHIVE_SELECTOR);
  await page.click(ARCHIVE_SELECTOR);
  await navigationPromise;

  // Click on Leather Goods
  const LEATHER_GOODS_SELECTOR =
    "body > main > div:nth-child(2) > div > div > div > nav > ul > li:nth-child(9) > a";
  await page.waitForSelector(LEATHER_GOODS_SELECTOR);
  await page.click(LEATHER_GOODS_SELECTOR);
  await navigationPromise;
  await page.screenshot({ path: "bf.png" });
  // Scrape all elements on sale
  const elements = await page.$$(".o-container.u-mt-md");
  await page.screenshot({ path: "af.png" });
  await navigationPromise;
  console.log("Elements:", elements.length, " Date:", new Date().toString());
  // Loop over every div element in sale section
  let state = "";
  for (let element of elements) {
    const p = await element.getProperty("innerHTML");
    const elem = await p.jsonValue();
    // Remove all html and join all meaningful text into single string
    let strippedString = elem.replace(/(<([^>]+)>)/gi, "");
    const arr = Array.from(strippedString);
    const filtered = arr.filter((elem) => elem !== " " && elem !== "\n");
    state += filtered.join("");
  }
  // Hash produced state
  // console.log("state ==>", state);
  const newHash = md5(state);
  // If change in state occurs log time, previous and new state for comparison
  if (prevHash !== newHash) {
    const changeObj = {
      date: new Date().toString(),
      prevState,
      state,
      prevHash,
      newHash,
    };
    stateChange.push(changeObj);
    console.log(changeObj);
  }
  prevHash = newHash;
  prevState = state;

  await browser.close();
}

const cron = require("node-cron");
cron.schedule("*/1 * * * *", saleDropped);
